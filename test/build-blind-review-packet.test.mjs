import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { after, before, describe, it } from "node:test";

import {
  buildBlindReviewPacket,
} from "../scripts/build-blind-review-packet.mjs";

const tmpRoot = mkdtempSync(path.join(tmpdir(), "bald-patch-blind-packet-test-"));
const checkoutsRoot = path.join(tmpRoot, "checkouts");

before(async () => {
  await mkdir(checkoutsRoot, { recursive: true });
  createPatchedCheckout("run-natural", "export const total = 1;\n");
  createPatchedCheckout("run-control", "export const total = 2;\n");
  createPatchedCheckout("run-skill", "export const total = 3;\n");
});

after(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe("build-blind-review-packet", () => {
  it("renders reviewer packets without private run metadata", () => {
    const result = buildBlindReviewPacket({
      checkoutsRoot,
      random: sequenceRandom([0.1, 0.9]),
      runs: sampleRuns(),
      tasks: sampleTasks(),
    });

    assert.match(result.packet, /# Bald Patch Blind Review Packet/);
    assert.match(result.packet, /## Task task-011/);
    assert.match(result.packet, /Align billing total formatting/);
    assert.match(result.packet, /Patch A/);
    assert.match(result.packet, /Patch B/);
    assert.match(result.packet, /Patch C/);
    assert.match(result.packet, /\+export const total = 3;/);

    for (const leaked of [
      "run-natural",
      "run-control",
      "run-skill",
      "natural-baseline",
      "prompt-control",
      "baldpatch-skill",
      "gpt-5.5",
      "fixture_task_id",
      "shared-format-helper",
    ]) {
      assert.equal(result.packet.includes(leaked), false, `${leaked} leaked into packet`);
    }

    assert.deepEqual(result.key, [
      {
        task_id: "task-011",
        patch: "A",
        arm: "baldpatch-skill",
        run_id: "run-skill",
        model: "gpt-5.5",
      },
      {
        task_id: "task-011",
        patch: "B",
        arm: "prompt-control",
        run_id: "run-control",
        model: "gpt-5.5",
      },
      {
        task_id: "task-011",
        patch: "C",
        arm: "natural-baseline",
        run_id: "run-natural",
        model: "gpt-5.5",
      },
    ]);

    const [answer] = parseAnswerTemplate(result.packet);
    assert.deepEqual(Object.keys(answer.patches), ["A", "B", "C"]);
    assert.deepEqual(answer.patches.A, {
      decision: "",
      expected_rework_minutes: null,
      scores: {
        requirements: null,
        correctness_safety: null,
        test_adequacy: null,
        maintainability_reviewability: null,
      },
      dependency_judgment: "",
      abstraction_judgment: "",
      overbuild_risk: "",
      underbuild_risk: "",
    });
  });

  it("requires at least two successful patches per reviewed task", () => {
    assert.throws(
      () => buildBlindReviewPacket({
        checkoutsRoot,
        runs: [sampleRuns()[0]],
        tasks: sampleTasks(),
      }),
      /Need at least two successful runs for task task-011/,
    );
  });

  it("includes untracked new files in patch diffs", () => {
    const result = buildBlindReviewPacket({
      checkoutsRoot,
      random: sequenceRandom([0.1, 0.9]),
      runs: sampleRuns(),
      tasks: sampleTasks(),
    });

    assert.match(result.packet, /diff --git a\/formatAmount\.js b\/formatAmount\.js/);
    assert.match(result.packet, /new file mode 100644/);
    assert.match(result.packet, /\+export function formatAmount\(amount\) \{/);
  });

  it("groups seeded repeatability runs by task and seed", () => {
    const runs = sampleSeededRuns();
    for (const run of runs) {
      createPatchedCheckout(run.run_id, `export const total = ${run.seed};\n`);
    }

    const result = buildBlindReviewPacket({
      checkoutsRoot,
      random: sequenceRandom([0.1, 0.1]),
      runs,
      tasks: [
        {
          public_id: "m5-task-008",
          neutral_title: "Respect an injected timer delay",
          natural_prompt: "Add a custom delayMs option while preserving the injected timer path.",
        },
      ],
    });

    assert.match(result.packet, /## Task m5-task-008 \(seed 1\)/);
    assert.match(result.packet, /## Task m5-task-008 \(seed 2\)/);
    assert.equal((result.packet.match(/## Task m5-task-008/g) || []).length, 2);
    assert.equal((result.packet.match(/### Patch A/g) || []).length, 2);
    assert.equal((result.packet.match(/### Patch C/g) || []).length, 0);

    assert.deepEqual(
      result.key.map((entry) => `${entry.task_id}:${entry.seed}:${entry.patch}:${entry.arm}`),
      [
        "m5-task-008:1:A:m9-timer-proof-draft",
        "m5-task-008:1:B:revised-baldpatch-skill",
        "m5-task-008:2:A:m9-timer-proof-draft",
        "m5-task-008:2:B:revised-baldpatch-skill",
      ],
    );

    assert.deepEqual(
      parseAnswerTemplate(result.packet).map((answer) => ({
        task_id: answer.task_id,
        seed: answer.seed,
        patches: Object.keys(answer.patches),
      })),
      [
        {
          task_id: "m5-task-008",
          seed: 1,
          patches: ["A", "B"],
        },
        {
          task_id: "m5-task-008",
          seed: 2,
          patches: ["A", "B"],
        },
      ],
    );
  });

  it("rejects empty packets when no successful runs are available", () => {
    assert.throws(
      () => buildBlindReviewPacket({
        checkoutsRoot,
        runs: [{ ...sampleRuns()[0], success: false }],
        tasks: sampleTasks(),
      }),
      /No successful runs available for blind review/,
    );
  });

  it("writes packet and key files from the CLI", () => {
    const runsFile = path.join(tmpRoot, "runs.jsonl");
    const packetFile = path.join(tmpRoot, "packet.md");
    const keyFile = path.join(tmpRoot, "key.json");
    writeFileSync(runsFile, `${sampleRuns().map((run) => JSON.stringify(run)).join("\n")}\n`);

    const cli = spawnSync(process.execPath, [
      "scripts/build-blind-review-packet.mjs",
      "--runs",
      runsFile,
      "--checkouts",
      checkoutsRoot,
      "--tasks",
      "evals/tasks",
      "--mode",
      "m2",
      "--seed",
      "unit",
      "--output-packet",
      packetFile,
      "--output-key",
      keyFile,
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    assert.equal(cli.status, 0, cli.stderr || cli.stdout);

    const packet = readFileSync(packetFile, "utf8");
    const key = JSON.parse(readFileSync(keyFile, "utf8"));
    assert.match(packet, /## Task task-011/);
    assert.equal(packet.includes("shared-format-helper"), false);
    assert.equal(packet.includes("baldpatch-skill"), false);
    assert.equal(key.length, 3);
  });
});

function sampleRuns() {
  return [
    {
      run_id: "run-natural",
      task_id: "task-011",
      fixture_task_id: "shared-format-helper",
      arm: "natural-baseline",
      model: "gpt-5.5",
      success: true,
    },
    {
      run_id: "run-control",
      task_id: "task-011",
      fixture_task_id: "shared-format-helper",
      arm: "prompt-control",
      model: "gpt-5.5",
      success: true,
    },
    {
      run_id: "run-skill",
      task_id: "task-011",
      fixture_task_id: "shared-format-helper",
      arm: "baldpatch-skill",
      model: "gpt-5.5",
      success: true,
    },
  ];
}

function sampleSeededRuns() {
  return [
    {
      run_id: "m9-m5-task-008-seed-1-revised-baldpatch-skill",
      task_id: "m5-task-008",
      seed: 1,
      arm: "revised-baldpatch-skill",
      model: "gpt-5.5",
      success: true,
    },
    {
      run_id: "m9-m5-task-008-seed-1-m9-timer-proof-draft",
      task_id: "m5-task-008",
      seed: 1,
      arm: "m9-timer-proof-draft",
      model: "gpt-5.5",
      success: true,
    },
    {
      run_id: "m9-m5-task-008-seed-2-revised-baldpatch-skill",
      task_id: "m5-task-008",
      seed: 2,
      arm: "revised-baldpatch-skill",
      model: "gpt-5.5",
      success: true,
    },
    {
      run_id: "m9-m5-task-008-seed-2-m9-timer-proof-draft",
      task_id: "m5-task-008",
      seed: 2,
      arm: "m9-timer-proof-draft",
      model: "gpt-5.5",
      success: true,
    },
  ];
}

function sampleTasks() {
  return [
    {
      id: "shared-format-helper",
      public_id: "task-011",
      neutral_title: "Align billing total formatting",
      natural_prompt: "Use a shared amount formatter for both summaries.",
    },
  ];
}

function createPatchedCheckout(runId, source) {
  const dir = path.join(checkoutsRoot, runId);
  mkdirSync(dir);
  writeFileSync(path.join(dir, "value.js"), "export const total = 0;\n");
  git(["init", "-q"], dir);
  git(["add", "."], dir);
  git([
    "-c",
    "user.email=bald-patch@example.local",
    "-c",
    "user.name=Bald Patch Eval",
    "commit",
    "-qm",
    "base",
  ], dir);
  git(["branch", "-M", "main"], dir);
  writeFileSync(path.join(dir, "value.js"), source);
  writeFileSync(
    path.join(dir, "formatAmount.js"),
    "export function formatAmount(amount) {\n  return amount.toFixed(2);\n}\n",
  );
}

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++] ?? 0;
}

function git(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function parseAnswerTemplate(packet) {
  const match = packet.match(/## Answer Template\n\n```json\n([\s\S]+?)\n```/);
  assert.ok(match, "answer template block not found");
  return JSON.parse(match[1]);
}

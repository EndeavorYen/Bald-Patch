import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

import {
  parseAgentTelemetry,
  renderAgentCommand,
  runEval,
  selectRuns,
} from "../scripts/run-m1-eval.mjs";
import { readTasks } from "../scripts/fixture-utils.mjs";

const tmpRoot = mkdtempSync(path.join(tmpdir(), "bald-patch-runner-test-"));

after(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe("run-m1-eval", () => {
  it("selects filtered task runs", () => {
    const runs = selectRuns(readTasks(), {
      taskId: "parser-edge-case",
      arm: "baseline",
    });

    assert.deepEqual(runs.map((run) => `${run.task_id}:${run.arm}`), [
      "parser-edge-case:baseline",
    ]);
  });

  it("selects M2 task runs by mode and arm", () => {
    const runs = selectRuns(readTasks(), {
      taskId: "parser-edge-case",
      arm: "prompt-control",
      mode: "m2",
    });

    assert.deepEqual(runs.map((run) => `${run.task_id}:${run.arm}`), [
      "parser-edge-case:prompt-control",
    ]);
    assert.match(runs[0].prompt, /Avoid unnecessary dependencies/);
    assert.doesNotMatch(runs[0].prompt, /Overbuild risks to watch/);
  });

  it("dry-runs M2 run contexts", () => {
    const rows = runEval({
      arm: "baldpatch-skill",
      limit: 1,
      mode: "m2",
      outRoot: path.join(tmpRoot, "m2-dry"),
      runIdPrefix: "m2",
      taskId: "parser-edge-case",
    });

    assert.equal(rows[0].run_id, "m2-parser-edge-case-baldpatch-skill");
    assert.match(rows[0].prompt_file, /m2-parser-edge-case-baldpatch-skill/);
  });

  it("renders shell-quoted agent command placeholders", () => {
    const command = renderAgentCommand("agent --cwd {fixture} --prompt {promptFile}", {
      fixture_dir: "/tmp/fixture with space",
      prompt_file: "/tmp/prompt.md",
    });

    assert.equal(command, "agent --cwd '/tmp/fixture with space' --prompt '/tmp/prompt.md'");
  });

  it("parses Codex model and tool-call telemetry from agent logs", () => {
    const telemetry = parseAgentTelemetry(`
OpenAI Codex v0.139.0
--------
model: gpt-5.5
provider: openai
--------
codex
I will inspect the parser.
exec
/bin/zsh -lc "rtk sed -n '1,120p' src/parser.js"
apply_patch
*** Begin Patch
`);

    assert.deepEqual(telemetry, {
      model: "gpt-5.5",
      tool_calls: 2,
    });
  });

  it("executes a local agent command and appends a real run record", () => {
    const fakeAgent = path.join(tmpRoot, "fake-agent.mjs");
    const recordFile = path.join(tmpRoot, "runs.jsonl");
    mkdirSync(path.dirname(fakeAgent), { recursive: true });
    writeFileSync(fakeAgent, fakeAgentSource());

    const rows = runEval({
      agentCommand: `node ${fakeAgent} --fixture {fixture} --prompt {promptFile}`,
      arm: "baseline",
      execute: true,
      outRoot: path.join(tmpRoot, "m1"),
      recordFile,
      runIdPrefix: "test",
      taskId: "parser-edge-case",
    });

    assert.deepEqual(rows, [
      {
        run_id: "test-parser-edge-case-baseline",
        ok: true,
        record_file: recordFile,
        artifact_dir: path.join(tmpRoot, "m1", "artifacts", "test-parser-edge-case-baseline"),
      },
    ]);

    const records = readFileSync(recordFile, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    assert.equal(records.length, 1);
    assert.equal(records[0].success, true);
    assert.equal(records[0].tests_passed, true);
    assert.equal(records[0].requirements_met, true);
    assert.equal(records[0].files_changed, 2);
    assert.equal(records[0].dependencies_added.length, 0);
  });

  it("records blocked runs without preparing or executing a fixture", () => {
    const recordFile = path.join(tmpRoot, "blocked-runs.jsonl");
    const outRoot = path.join(tmpRoot, "blocked-m1");

    const rows = runEval({
      arm: "baseline",
      blockReason: "external Codex execution was not approved",
      outRoot,
      recordBlocked: true,
      recordFile,
      runIdPrefix: "blocked",
      taskId: "parser-edge-case",
    });

    assert.deepEqual(rows, [
      {
        run_id: "blocked-parser-edge-case-baseline",
        ok: false,
        blocked: true,
        record_file: recordFile,
      },
    ]);
    assert.equal(
      existsSync(path.join(outRoot, "checkouts", "blocked-parser-edge-case-baseline")),
      false,
    );

    const [record] = readFileSync(recordFile, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    assert.equal(record.blocked, true);
    assert.equal(record.block_reason, "external Codex execution was not approved");
    assert.equal(record.success, false);
    assert.equal(record.tests_passed, false);
    assert.equal(record.requirements_met, false);
  });
});

function fakeAgentSource() {
  return `
import { writeFileSync } from "node:fs";
import path from "node:path";

const fixture = process.argv[process.argv.indexOf("--fixture") + 1];

writeFileSync(path.join(fixture, "src/parser.js"), \`
export function parseRecords(text) {
  return text
    .split("\\\\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [name, value] = line.split(",");
      return {
        name,
        value: Number(value),
      };
    });
}
\`);

writeFileSync(path.join(fixture, "test/parser-edge-case.test.mjs"), \`
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseRecords } from "../src/parser.js";

describe("parseRecords trailing blank lines", () => {
  it("ignores a trailing blank line", () => {
    assert.deepEqual(parseRecords("alpha,1\\\\nbeta,2\\\\n"), [
      { name: "alpha", value: 1 },
      { name: "beta", value: 2 },
    ]);
  });
});
\`);
`;
}

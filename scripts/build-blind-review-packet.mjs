import { randomInt } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readTasks } from "./fixture-utils.mjs";
import { parseJsonl } from "./score-run.mjs";

const PATCH_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function buildBlindReviewPacket({
  base = "main",
  checkoutsRoot,
  random = defaultRandom,
  runs,
  tasks = [],
} = {}) {
  if (!checkoutsRoot) {
    throw new Error("checkoutsRoot is required");
  }
  if (!Array.isArray(runs)) {
    throw new Error("runs are required");
  }

  const taskMap = buildTaskMap(tasks);
  const groups = groupSuccessfulRuns(runs);
  if (groups.size === 0) {
    throw new Error("No successful runs available for blind review");
  }
  const packetLines = [
    "# Bald Patch Blind Review Packet",
    "",
    "Review the patches by correctness, scope, safety, tests, maintainability, and expected human rework.",
    "For each patch, fill decision, expected rework minutes, scores, dependency judgment, abstraction judgment, overbuild risk, and underbuild risk.",
    "Use risk values `none`, `low`, `medium`, or `high`.",
    "Use the answer template at the end. Do not use private run metadata.",
    "",
  ];
  const key = [];
  const answerTemplate = [];

  for (const group of [...groups.values()].sort(compareReviewGroups)) {
    const { taskId, seed, runs: taskRuns } = group;
    if (taskRuns.length < 2) {
      throw new Error(`Need at least two successful runs for ${reviewGroupName(group)}`);
    }
    if (taskRuns.length > PATCH_LABELS.length) {
      throw new Error(`Too many patches for ${reviewGroupName(group)}`);
    }

    const task = taskMap.get(taskId);
    packetLines.push(reviewGroupHeading(group), "");
    if (task) {
      packetLines.push(`Request: ${task.title}`, "");
      if (task.prompt) {
        packetLines.push(task.prompt, "");
      }
    }

    const shuffled = shuffle(taskRuns, random);
    const patchLabels = [];
    shuffled.forEach((run, index) => {
      const patch = PATCH_LABELS[index];
      patchLabels.push(patch);
      key.push({
        task_id: taskId,
        ...(seed === undefined ? {} : { seed }),
        patch,
        arm: run.arm,
        run_id: run.run_id,
        model: run.model ?? null,
      });
      packetLines.push(`### Patch ${patch}`, "");
      packetLines.push("```diff");
      packetLines.push(gitDiff(checkoutPath(run, checkoutsRoot), base).trimEnd());
      packetLines.push("```", "");
    });

    answerTemplate.push({
      task_id: taskId,
      ...(seed === undefined ? {} : { seed }),
      preferred_patch: "",
      confidence: null,
      reason: "",
      patches: Object.fromEntries(patchLabels.map((patch) => {
        return [patch, patchAssessmentTemplate()];
      })),
    });
  }

  packetLines.push("## Answer Template", "");
  packetLines.push("```json");
  packetLines.push(JSON.stringify(answerTemplate, null, 2));
  packetLines.push("```", "");

  return {
    packet: packetLines.join("\n"),
    key,
  };
}

function buildTaskMap(tasks) {
  const map = new Map();
  for (const task of tasks) {
    const metadata = {
      title: task.neutral_title || task.title || task.public_id || task.id,
      prompt: task.natural_prompt || task.prompt || "",
    };
    if (task.id) {
      map.set(task.id, metadata);
    }
    if (task.public_id) {
      map.set(task.public_id, metadata);
    }
  }
  return map;
}

function groupSuccessfulRuns(runs) {
  const groups = new Map();
  for (const run of runs) {
    if (run.blocked || run.success !== true) {
      continue;
    }
    const groupId = reviewGroupId(run);
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        taskId: run.task_id,
        seed: run.seed,
        runs: [],
      });
    }
    groups.get(groupId).runs.push(run);
  }
  return groups;
}

function reviewGroupId(run) {
  return run.seed === undefined ? run.task_id : `${run.task_id}::seed-${run.seed}`;
}

function compareReviewGroups(left, right) {
  const taskOrder = left.taskId.localeCompare(right.taskId);
  if (taskOrder !== 0) {
    return taskOrder;
  }
  if (left.seed === undefined && right.seed === undefined) {
    return 0;
  }
  if (left.seed === undefined) {
    return -1;
  }
  if (right.seed === undefined) {
    return 1;
  }
  return left.seed - right.seed;
}

function reviewGroupName(group) {
  return group.seed === undefined
    ? `task ${group.taskId}`
    : `task ${group.taskId} seed ${group.seed}`;
}

function reviewGroupHeading(group) {
  return group.seed === undefined
    ? `## Task ${group.taskId}`
    : `## Task ${group.taskId} (seed ${group.seed})`;
}

function checkoutPath(run, checkoutsRoot) {
  if (run.fixture_dir) {
    return run.fixture_dir;
  }
  return path.join(checkoutsRoot, run.run_id);
}

function gitDiff(cwd, base) {
  const result = spawnSync("git", ["diff", "--no-ext-diff", "--no-color", base], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git diff failed in ${cwd}`);
  }
  const untrackedDiffs = gitUntrackedFiles(cwd).map((file) => newFileDiff(cwd, file));
  const chunks = [result.stdout.trimEnd(), ...untrackedDiffs].filter(Boolean);
  return chunks.length > 0 ? chunks.join("\n") : "(empty diff)";
}

function gitUntrackedFiles(cwd) {
  const result = spawnSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ls-files failed in ${cwd}`);
  }
  return result.stdout.split("\0").filter(Boolean);
}

function newFileDiff(cwd, file) {
  const absolutePath = path.join(cwd, file);
  const mode = statSync(absolutePath).mode & 0o111 ? "100755" : "100644";
  const content = readFileSync(absolutePath, "utf8");
  const hash = gitHashObject(cwd, file).slice(0, 7);
  const lines = content.endsWith("\n") ? content.split("\n").slice(0, -1) : content.split("\n");
  const diffLines = [
    `diff --git a/${file} b/${file}`,
    `new file mode ${mode}`,
    `index 0000000..${hash}`,
    "--- /dev/null",
    `+++ b/${file}`,
  ];

  if (lines.length > 0 && lines[0] !== "") {
    diffLines.push(`@@ -0,0 +1,${lines.length} @@`);
    diffLines.push(...lines.map((line) => `+${line}`));
    if (!content.endsWith("\n")) {
      diffLines.push("\\ No newline at end of file");
    }
  }

  return diffLines.join("\n");
}

function gitHashObject(cwd, file) {
  const result = spawnSync("git", ["hash-object", "--no-filters", "--", file], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git hash-object failed for ${file} in ${cwd}`);
  }
  return result.stdout.trim();
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function defaultRandom() {
  return randomInt(0, 0x100000000) / 0x100000000;
}

function patchAssessmentTemplate() {
  return {
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
  };
}

function seededRandom(seed) {
  let state = 0x811c9dc5;
  for (const char of seed) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 0x01000193);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

function parseArgs(argv) {
  const args = {
    base: "main",
    checkoutsRoot: null,
    mode: "m1",
    outputKey: null,
    outputPacket: null,
    runs: null,
    seed: null,
    taskRoot: "evals/tasks",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") {
      args.base = argv[index + 1];
      index += 1;
    } else if (arg === "--checkouts") {
      args.checkoutsRoot = argv[index + 1];
      index += 1;
    } else if (arg === "--mode") {
      args.mode = argv[index + 1];
      index += 1;
    } else if (arg === "--output-key") {
      args.outputKey = argv[index + 1];
      index += 1;
    } else if (arg === "--output-packet") {
      args.outputPacket = argv[index + 1];
      index += 1;
    } else if (arg === "--runs") {
      args.runs = argv[index + 1];
      index += 1;
    } else if (arg === "--seed") {
      args.seed = argv[index + 1];
      index += 1;
    } else if (arg === "--tasks") {
      args.taskRoot = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.runs || !args.checkoutsRoot) {
    throw new Error("--runs and --checkouts are required");
  }

  const result = buildBlindReviewPacket({
    base: args.base,
    checkoutsRoot: args.checkoutsRoot,
    random: args.seed ? seededRandom(args.seed) : defaultRandom,
    runs: parseJsonl(readFileSync(args.runs, "utf8")),
    tasks: readTasks(args.taskRoot, { mode: args.mode }),
  });

  if (args.outputPacket) {
    writeFileSync(args.outputPacket, result.packet);
  } else {
    process.stdout.write(result.packet);
  }
  if (args.outputKey) {
    writeFileSync(args.outputKey, `${JSON.stringify(result.key, null, 2)}\n`);
  }
}

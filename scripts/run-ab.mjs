import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { readTasks } from "./fixture-utils.mjs";

const MODE_ARMS = {
  m1: ["baseline", "skill"],
  m2: ["natural-baseline", "prompt-control", "baldpatch-skill"],
  m4: ["m4-reviewer-proof-control"],
  m5: ["natural-baseline", "prompt-control", "old-baldpatch-skill", "provisional-baldpatch-skill"],
  m7: ["old-baldpatch-skill", "revised-baldpatch-skill"],
  m8: ["revised-baldpatch-skill", "m8-timer-proof-draft"],
};

const GENERIC_PROMPT_CONTROL = "Avoid unnecessary dependencies, speculative abstractions, and unrelated rewrites while preserving correctness, tests, and existing behavior.";
const REVIEWER_PROOF_CONTROL = `Before editing, identify the smallest reviewer-visible proof for this task.

Rules:
1. Do not add or export a helper solely for a tiny branch; test existing public behavior when that is enough.
2. Prefer scoped deterministic timer facilities over global mock setup when the test framework provides them.
3. For validators, name and test the accepted/rejected boundary before choosing the implementation.
4. For stateful form additions, test both populated field state and default state preservation when the existing API exposes defaults.
5. For user-facing output, include minimal semantic labels that explain new data.
6. For shared helpers, preserve existing wrapper call paths unless the request explicitly asks to remove them.

After implementing, run the smallest meaningful verification and leave the working tree ready for diff metrics.`;

const M8_TIMER_PROOF_ADDENDUM = `M8 diagnostic addendum:
- When preserving an injected scheduler or timer path, prove both the scheduling argument and the callback side effect. For example, a delay option test should also execute the injected callback and assert the original notification/message still happens.
- Do not add broader timer machinery, sleeps, global fake timers, or extra helper API solely for this proof.
- Keep LOC pressure active: add this proof only where the request asks to preserve an injected timer path or equivalent callback behavior.`;

export function loadTasks(taskRoot = "evals/tasks", options = {}) {
  return readTasks(taskRoot, options);
}

export function buildRunPlan(tasks, options = {}) {
  const { arms, mode } = normalizeOptions(options);
  return tasks.flatMap((task) => {
    const taskId = ["m2", "m4", "m5", "m7", "m8"].includes(mode) ? task.public_id || task.id : task.id;
    return arms.map((arm) => ({
      task_id: taskId,
      ...(taskId !== task.id ? { fixture_task_id: task.id } : {}),
      arm,
      fixture_project: task.fixture?.project || null,
      fixture_verify: task.fixture?.verify || null,
      prompt: buildPrompt(task, arm, { mode }),
    }));
  });
}

export function buildPrompt(task, arm, {
  mode = modeForArm(arm),
} = {}) {
  if (mode === "m4") {
    return buildM4Prompt(task);
  }

  if (mode === "m5") {
    return buildM5Prompt(task, arm);
  }

  if (mode === "m7") {
    return buildM7Prompt(task, arm);
  }

  if (mode === "m8") {
    return buildM8Prompt(task, arm);
  }

  if (mode === "m2") {
    return buildM2Prompt(task, arm);
  }

  const lines = [];
  if (arm === "skill") {
    lines.push("$baldpatch-patch");
    lines.push("");
  }

  lines.push(`# ${task.title}`);
  lines.push("");
  lines.push(task.prompt);
  lines.push("");
  lines.push("Success criteria:");
  for (const criterion of task.success_criteria || []) {
    lines.push(`- ${criterion}`);
  }
  lines.push("");
  lines.push("Overbuild risks to watch:");
  for (const risk of task.overbuild_risks || []) {
    lines.push(`- ${risk}`);
  }
  lines.push("");
  lines.push("After implementing, run the smallest meaningful verification and leave the working tree ready for diff metrics.");

  return lines.join("\n");
}

function buildM2Prompt(task, arm) {
  const lines = [];
  if (arm === "baldpatch-skill") {
    lines.push("$baldpatch-patch");
    lines.push("");
  }

  lines.push(`# ${task.neutral_title || task.title}`);
  lines.push("");
  lines.push(task.natural_prompt || task.prompt);

  if (arm === "prompt-control") {
    lines.push("");
    lines.push(GENERIC_PROMPT_CONTROL);
  }

  return lines.join("\n");
}

function buildM4Prompt(task) {
  return [
    `# ${task.neutral_title || task.title}`,
    "",
    task.natural_prompt || task.prompt,
    "",
    REVIEWER_PROOF_CONTROL,
  ].join("\n");
}

function buildM5Prompt(task, arm) {
  if (arm === "natural-baseline" || arm === "prompt-control") {
    return buildM2Prompt(task, arm);
  }

  const snapshot = arm === "old-baldpatch-skill"
    ? {
        label: "old",
        text: readSkillSnapshot("pre-m5-baldpatch-patch"),
      }
    : {
        label: "provisional",
        text: readSkillSnapshot("provisional-m5-baldpatch-patch"),
      };

  return [
    `# ${task.neutral_title || task.title}`,
    "",
    task.natural_prompt || task.prompt,
    "",
    `Use this exact ${snapshot.label} Bald Patch skill guidance for this run. Do not use another Bald Patch skill version.`,
    "",
    "```markdown",
    snapshot.text.trim(),
    "```",
    "",
    "After implementing, run the smallest meaningful verification and leave the working tree ready for diff metrics.",
  ].join("\n");
}

function buildM7Prompt(task, arm) {
  let snapshot;
  if (arm === "old-baldpatch-skill") {
    snapshot = {
      label: "old",
      text: readSkillSnapshot("pre-m5-baldpatch-patch"),
    };
  } else if (arm === "revised-baldpatch-skill") {
    snapshot = {
      label: "revised post-M5",
      text: readSkillSnapshot("post-m5-baldpatch-patch"),
    };
  } else {
    throw new Error(`Unsupported M7 arm: ${arm}`);
  }

  return [
    `# ${task.neutral_title || task.title}`,
    "",
    task.natural_prompt || task.prompt,
    "",
    `Use this exact ${snapshot.label} Bald Patch skill guidance for this run. Do not use another Bald Patch skill version.`,
    "",
    "```markdown",
    snapshot.text.trim(),
    "```",
    "",
    "After implementing, run the smallest meaningful verification and leave the working tree ready for diff metrics.",
  ].join("\n");
}

function buildM8Prompt(task, arm) {
  if (arm === "revised-baldpatch-skill") {
    return buildM7Prompt(task, arm);
  }

  if (arm !== "m8-timer-proof-draft") {
    throw new Error(`Unsupported M8 arm: ${arm}`);
  }

  const snapshot = {
    label: "M8 timer-proof draft",
    text: readSkillSnapshot("post-m5-baldpatch-patch"),
  };

  return [
    `# ${task.neutral_title || task.title}`,
    "",
    task.natural_prompt || task.prompt,
    "",
    `Use this exact ${snapshot.label} Bald Patch guidance for this run. Do not use another Bald Patch skill version.`,
    "",
    "```markdown",
    snapshot.text.trim(),
    "",
    M8_TIMER_PROOF_ADDENDUM,
    "```",
    "",
    "After implementing, run the smallest meaningful verification and leave the working tree ready for diff metrics.",
  ].join("\n");
}

function readSkillSnapshot(name) {
  return readFileSync(new URL(`../evals/skill-snapshots/${name}/SKILL.md`, import.meta.url), "utf8");
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return {
      arms: options,
      mode: "m1",
    };
  }
  const mode = options.mode || "m1";
  return {
    arms: options.arms || armsForMode(mode),
    mode,
  };
}

function armsForMode(mode) {
  if (!MODE_ARMS[mode]) {
    throw new Error(`Unknown run plan mode: ${mode}`);
  }
  return MODE_ARMS[mode];
}

function modeForArm(arm) {
  if (MODE_ARMS.m4.includes(arm)) {
    return "m4";
  }

  if (MODE_ARMS.m5.includes(arm)) {
    return "m5";
  }

  if (MODE_ARMS.m7.includes(arm)) {
    return "m7";
  }

  if (MODE_ARMS.m8.includes(arm)) {
    return "m8";
  }

  return MODE_ARMS.m2.includes(arm) ? "m2" : "m1";
}

function parseArgs(argv) {
  const args = {
    mode: "m1",
    taskRoot: "evals/tasks",
    jsonl: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--tasks") {
      args.taskRoot = argv[index + 1];
      index += 1;
    } else if (arg === "--jsonl") {
      args.jsonl = true;
    } else if (arg === "--mode") {
      args.mode = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function printPlan(plan, jsonl) {
  if (jsonl) {
    for (const run of plan) {
      console.log(JSON.stringify(run));
    }
    return;
  }

  for (const run of plan) {
    console.log(`## ${run.task_id} / ${run.arm}`);
    console.log("");
    console.log("```text");
    console.log(run.prompt);
    console.log("```");
    console.log("");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  printPlan(buildRunPlan(loadTasks(args.taskRoot, { mode: args.mode }), { mode: args.mode }), args.jsonl);
}

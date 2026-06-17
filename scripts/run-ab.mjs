import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODE_ARMS = {
  m1: ["baseline", "skill"],
  m2: ["natural-baseline", "prompt-control", "baldpatch-skill"],
};

const GENERIC_PROMPT_CONTROL = "Avoid unnecessary dependencies, speculative abstractions, and unrelated rewrites while preserving correctness, tests, and existing behavior.";

export function loadTasks(taskRoot = "evals/tasks") {
  return ["real", "traps"]
    .flatMap((group) => {
      const dir = path.join(taskRoot, group);
      return readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf8")));
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function buildRunPlan(tasks, options = {}) {
  const { arms, mode } = normalizeOptions(options);
  return tasks.flatMap((task) => {
    const taskId = mode === "m2" ? task.public_id || task.id : task.id;
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
  printPlan(buildRunPlan(loadTasks(args.taskRoot), { mode: args.mode }), args.jsonl);
}

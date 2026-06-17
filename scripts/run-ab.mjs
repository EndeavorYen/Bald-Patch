import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ARMS = ["baseline", "skill"];

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

export function buildRunPlan(tasks, arms = ARMS) {
  return tasks.flatMap((task) => {
    return arms.map((arm) => ({
      task_id: task.id,
      arm,
      prompt: buildPrompt(task, arm),
    }));
  });
}

export function buildPrompt(task, arm) {
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

function parseArgs(argv) {
  const args = {
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
  printPlan(buildRunPlan(loadTasks(args.taskRoot)), args.jsonl);
}

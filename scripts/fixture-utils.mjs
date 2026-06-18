import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const TASK_GROUPS_BY_MODE = {
  m1: ["real", "traps"],
  m2: ["real", "traps", "positive"],
  m4: ["real", "traps", "positive"],
  m5: ["m5"],
  m7: ["m5"],
  m8: ["m5"],
};

const TASK_FILTERS_BY_MODE = {
  m7: new Set([
    "m5-task-001",
    "m5-task-002",
    "m5-task-003",
    "m5-task-004",
    "m5-task-005",
    "m5-task-007",
    "m5-task-008",
    "m5-task-010",
    "m5-task-011",
    "m5-task-012",
  ]),
  m8: new Set([
    "m5-task-002",
    "m5-task-003",
    "m5-task-004",
    "m5-task-005",
    "m5-task-008",
    "m5-task-011",
  ]),
};

const ALL_TASK_GROUPS = Array.from(new Set(Object.values(TASK_GROUPS_BY_MODE).flat()));

export function readTasks(taskRoot = "evals/tasks", options = {}) {
  const mode = options.mode || "m1";
  const tasks = readTaskGroups(taskRoot, taskGroupsForMode(mode));
  const filter = TASK_FILTERS_BY_MODE[mode];
  return filter
    ? tasks.filter((task) => filter.has(task.public_id || task.id))
    : tasks;
}

export function findTask(taskId, taskRoot = "evals/tasks", options = {}) {
  const groups = options.mode ? taskGroupsForMode(options.mode) : ALL_TASK_GROUPS;
  const task = readTaskGroups(taskRoot, groups).find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new Error(`Unknown task: ${taskId}`);
  }
  return task;
}

export function taskGroupsForMode(mode = "m1") {
  const groups = TASK_GROUPS_BY_MODE[mode];
  if (!groups) {
    throw new Error(`Unknown task mode: ${mode}`);
  }
  return groups;
}

function readTaskGroups(taskRoot, groups) {
  return groups
    .flatMap((group) => {
      const dir = path.join(taskRoot, group);
      return readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf8")));
    })
    .sort((left, right) => {
      return (left.public_id || left.id).localeCompare(right.public_id || right.id);
    });
}

export function requireFixture(task) {
  if (!task.fixture?.project || !task.fixture?.acceptance || !task.fixture?.verify) {
    throw new Error(`Task ${task.id} is missing fixture metadata`);
  }
  return task.fixture;
}

export function fixturePaths(task, repoRoot = process.cwd()) {
  const fixture = requireFixture(task);
  return {
    project: path.resolve(repoRoot, fixture.project),
    acceptance: path.resolve(repoRoot, fixture.acceptance),
    verify: fixture.verify,
  };
}

export function assertFixtureExists(task, repoRoot = process.cwd()) {
  const paths = fixturePaths(task, repoRoot);
  for (const [name, fixturePath] of Object.entries(paths)) {
    if (name === "verify") {
      continue;
    }
    if (!existsSync(fixturePath)) {
      throw new Error(`Missing ${name} fixture for ${task.id}: ${fixturePath}`);
    }
  }
  return paths;
}

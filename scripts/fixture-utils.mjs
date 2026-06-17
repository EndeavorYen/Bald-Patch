import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export function readTasks(taskRoot = "evals/tasks") {
  return ["real", "traps"]
    .flatMap((group) => {
      const dir = path.join(taskRoot, group);
      return readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf8")));
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function findTask(taskId, taskRoot = "evals/tasks") {
  const task = readTasks(taskRoot).find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new Error(`Unknown task: ${taskId}`);
  }
  return task;
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

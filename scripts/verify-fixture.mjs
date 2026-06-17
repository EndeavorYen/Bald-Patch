import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertFixtureExists, findTask } from "./fixture-utils.mjs";

export function verifyFixture({
  taskId,
  cwd,
  repoRoot = process.cwd(),
} = {}) {
  if (!taskId) {
    throw new Error("taskId is required");
  }
  if (!cwd) {
    throw new Error("cwd is required");
  }

  const task = findTask(taskId, path.join(repoRoot, "evals/tasks"));
  const fixture = assertFixtureExists(task, repoRoot);
  const project = path.resolve(cwd);

  const publicTests = run("npm", ["test"], {
    cwd: project,
  });
  if (publicTests.status !== 0) {
    return {
      task_id: task.id,
      ok: false,
      phase: "public-tests",
      stdout: publicTests.stdout,
      stderr: publicTests.stderr,
    };
  }

  const acceptanceFiles = readdirSync(fixture.acceptance)
    .filter((file) => file.endsWith(".test.mjs"))
    .map((file) => path.join(fixture.acceptance, file));

  const acceptance = run("node", ["--test", ...acceptanceFiles], {
    cwd: repoRoot,
    env: {
      ...process.env,
      BALD_PATCH_FIXTURE_CWD: project,
    },
  });

  return {
    task_id: task.id,
    ok: acceptance.status === 0,
    phase: acceptance.status === 0 ? "complete" : "acceptance",
    stdout: acceptance.stdout,
    stderr: acceptance.stderr,
  };
}

function run(command, args, options) {
  const env = cleanChildEnv(options.env || process.env);
  return spawnSync(command, args, {
    ...options,
    env,
    encoding: "utf8",
  });
}

function cleanChildEnv(env) {
  const cleaned = { ...env };
  for (const key of Object.keys(cleaned)) {
    if (key.startsWith("NODE_TEST_")) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

function parseArgs(argv) {
  const args = {
    taskId: null,
    cwd: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--task") {
      args.taskId = argv[index + 1];
      index += 1;
    } else if (arg === "--cwd") {
      args.cwd = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = verifyFixture(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 1;
}

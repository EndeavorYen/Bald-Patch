import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { assertFixtureExists, findTask } from "./fixture-utils.mjs";

export function prepareFixture({
  taskId,
  outDir,
  repoRoot = process.cwd(),
  force = false,
  initGit = true,
} = {}) {
  if (!taskId) {
    throw new Error("taskId is required");
  }
  if (!outDir) {
    throw new Error("outDir is required");
  }

  const task = findTask(taskId, path.join(repoRoot, "evals/tasks"));
  const fixture = assertFixtureExists(task, repoRoot);
  const output = path.resolve(outDir);

  assertSafeOutputPath(output, repoRoot);
  if (existsSync(output)) {
    if (!force) {
      throw new Error(`Output already exists. Pass --force to replace: ${output}`);
    }
    rmSync(output, { recursive: true, force: true });
  }

  mkdirSync(path.dirname(output), { recursive: true });
  cpSync(fixture.project, output, { recursive: true });

  if (initGit) {
    git(["init", "-q"], output);
    git(["add", "."], output);
    git([
      "-c",
      "user.email=bald-patch@example.local",
      "-c",
      "user.name=Bald Patch Eval",
      "commit",
      "-qm",
      "fixture base",
    ], output);
    git(["branch", "-M", "main"], output);
  }

  return {
    task_id: task.id,
    title: task.title,
    out: output,
    verify: task.fixture.verify.replace("<fixture>", output),
  };
}

function assertSafeOutputPath(output, repoRoot) {
  const parsed = path.parse(output);
  const root = parsed.root;
  const resolvedRepo = path.resolve(repoRoot);

  if (output === root || output === resolvedRepo || resolvedRepo.startsWith(`${output}${path.sep}`)) {
    throw new Error(`Refusing unsafe output path: ${output}`);
  }
}

function git(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }
}

function parseArgs(argv) {
  const args = {
    taskId: null,
    outDir: null,
    force: false,
    initGit: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--task") {
      args.taskId = argv[index + 1];
      index += 1;
    } else if (arg === "--out") {
      args.outDir = argv[index + 1];
      index += 1;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--no-git") {
      args.initGit = false;
    }
  }

  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = prepareFixture(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

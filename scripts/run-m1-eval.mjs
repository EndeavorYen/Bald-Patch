import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { collectDiffMetrics } from "./collect-diff-metrics.mjs";
import { collectScopeLint } from "./scope-lint.mjs";
import { readTasks } from "./fixture-utils.mjs";
import { prepareFixture } from "./prepare-fixture.mjs";
import { buildRunPlan } from "./run-ab.mjs";
import { verifyFixture } from "./verify-fixture.mjs";

export function selectRuns(tasks, {
  taskId = null,
  arm = null,
  limit = null,
} = {}) {
  let runs = buildRunPlan(tasks);
  if (taskId) {
    runs = runs.filter((run) => run.task_id === taskId);
  }
  if (arm) {
    runs = runs.filter((run) => run.arm === arm);
  }
  if (limit !== null) {
    runs = runs.slice(0, limit);
  }
  return runs;
}

export function buildRunContext(run, {
  outRoot,
  runIdPrefix,
} = {}) {
  const runId = `${runIdPrefix}-${run.task_id}-${run.arm}`;
  return {
    ...run,
    run_id: runId,
    fixture_dir: path.join(outRoot, "checkouts", runId),
    artifact_dir: path.join(outRoot, "artifacts", runId),
  };
}

export function renderAgentCommand(template, context) {
  if (!template) {
    return null;
  }

  const values = {
    arm: context.arm,
    artifactDir: context.artifact_dir,
    fixture: context.fixture_dir,
    promptFile: context.prompt_file,
    runId: context.run_id,
    task: context.task_id,
  };

  return template.replace(/\{([A-Za-z]+)\}/g, (match, key) => {
    if (!(key in values)) {
      return match;
    }
    return shellQuote(values[key]);
  });
}

export function runEval({
  taskId = null,
  arm = null,
  limit = null,
  outRoot = "/private/tmp/bald-patch-m1",
  runIdPrefix = isoDate(),
  recordFile = null,
  agentCommand = null,
  blockReason = null,
  execute = false,
  recordBlocked = false,
  repoRoot = process.cwd(),
} = {}) {
  const runs = selectRuns(readTasks(path.join(repoRoot, "evals/tasks")), {
    taskId,
    arm,
    limit,
  });
  const planned = runs.map((run) => buildRunContext(run, {
    outRoot,
    runIdPrefix,
  }));

  if (recordBlocked) {
    if (!recordFile) {
      throw new Error("--record is required with --record-blocked");
    }
    if (!blockReason) {
      throw new Error("--blocker is required with --record-blocked");
    }
    mkdirSync(path.dirname(path.resolve(recordFile)), { recursive: true });
    return planned.map((context) => {
      const record = blockedRecord(context, blockReason);
      writeFileSync(recordFile, `${JSON.stringify(record)}\n`, {
        flag: "a",
      });
      return {
        run_id: context.run_id,
        ok: false,
        blocked: true,
        record_file: recordFile,
      };
    });
  }

  if (!execute) {
    return planned.map((context) => dryRunRow(context, agentCommand));
  }

  if (!agentCommand) {
    throw new Error("--agent-command is required with --execute");
  }
  if (!recordFile) {
    throw new Error("--record is required with --execute");
  }

  mkdirSync(path.dirname(path.resolve(recordFile)), { recursive: true });

  return planned.map((context) => {
    const result = executeRun(context, {
      agentCommand,
      recordFile,
      repoRoot,
    });
    writeFileSync(recordFile, `${JSON.stringify(result.record)}\n`, {
      flag: "a",
    });
    return result.summary;
  });
}

function blockedRecord(context, reason) {
  return {
    run_id: context.run_id,
    task_id: context.task_id,
    arm: context.arm,
    blocked: true,
    block_reason: reason,
    model: null,
    success: false,
    tests_passed: false,
    requirements_met: false,
    files_changed: null,
    new_files: null,
    lines_added: null,
    lines_deleted: null,
    dependencies_added: [],
    tool_calls: null,
    elapsed_ms: null,
    scope_violations: [],
    overengineering_findings: [],
    human_rework_minutes: null,
    reviewer_preferred: null,
  };
}

function dryRunRow(context, agentCommand) {
  const promptFile = path.join(context.artifact_dir, "prompt.md");
  return {
    run_id: context.run_id,
    task_id: context.task_id,
    arm: context.arm,
    fixture_dir: context.fixture_dir,
    prompt_file: promptFile,
    verify: context.fixture_verify.replace("<fixture>", context.fixture_dir),
    agent_command: renderAgentCommand(agentCommand, {
      ...context,
      prompt_file: promptFile,
    }),
  };
}

function executeRun(context, {
  agentCommand,
  recordFile,
  repoRoot,
}) {
  mkdirSync(context.artifact_dir, { recursive: true });
  const prepared = prepareFixture({
    taskId: context.task_id,
    outDir: context.fixture_dir,
    force: true,
    repoRoot,
  });
  const promptFile = path.join(context.artifact_dir, "prompt.md");
  const outputFile = path.join(context.artifact_dir, "agent-output.txt");
  const errorFile = path.join(context.artifact_dir, "agent-error.txt");
  writeFileSync(promptFile, context.prompt);

  const command = renderAgentCommand(agentCommand, {
    ...context,
    prompt_file: promptFile,
  });
  const startedAt = Date.now();
  const agent = spawnSync(command, [], {
    cwd: prepared.out,
    encoding: "utf8",
    shell: true,
  });
  const elapsedMs = Date.now() - startedAt;
  writeFileSync(outputFile, agent.stdout || "");
  writeFileSync(errorFile, agent.stderr || "");
  const telemetry = parseAgentTelemetry(agent.stderr || "");

  const verification = verifyFixture({
    taskId: context.task_id,
    cwd: prepared.out,
    repoRoot,
  });
  const metrics = collectDiffMetrics({
    base: "main",
    cwd: prepared.out,
  });
  const scope = collectScopeLint({
    base: "main",
    cwd: prepared.out,
  });
  const dependenciesAdded = collectDependenciesAdded(prepared.out);
  const success = agent.status === 0 && verification.ok;

  const record = {
    run_id: context.run_id,
    task_id: context.task_id,
    arm: context.arm,
    model: telemetry.model,
    success,
    tests_passed: verification.phase !== "public-tests",
    requirements_met: verification.ok,
    files_changed: metrics.files_changed,
    new_files: metrics.new_files,
    lines_added: metrics.lines_added,
    lines_deleted: metrics.lines_deleted,
    dependencies_added: dependenciesAdded,
    tool_calls: telemetry.tool_calls,
    elapsed_ms: elapsedMs,
    scope_violations: scope.warnings.map((warning) => warning.code),
    overengineering_findings: [],
    human_rework_minutes: null,
    reviewer_preferred: null,
    agent_exit_code: agent.status,
    verification_phase: verification.phase,
    artifact_dir: context.artifact_dir,
  };

  return {
    record,
    summary: {
      run_id: context.run_id,
      ok: success,
      record_file: recordFile,
      artifact_dir: context.artifact_dir,
    },
  };
}

export function parseAgentTelemetry(logText) {
  const model = logText.match(/^model:\s*(.+)$/m)?.[1]?.trim()
    || "external-agent-command";
  const toolCalls = logText
    .split(/\r?\n/)
    .filter((line) => /^(exec|apply_patch|view_image)$/.test(line.trim()))
    .length;

  return {
    model,
    tool_calls: toolCalls === 0 ? null : toolCalls,
  };
}

function collectDependenciesAdded(cwd) {
  const before = readPackageDependenciesFromGit(cwd);
  const after = readPackageDependencies(path.join(cwd, "package.json"));
  return [...after].filter((name) => !before.has(name)).sort();
}

function readPackageDependenciesFromGit(cwd) {
  const result = spawnSync("git", ["show", "main:package.json"], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return new Set();
  }
  return dependenciesFromPackageJson(result.stdout);
}

function readPackageDependencies(packagePath) {
  try {
    return dependenciesFromPackageJson(readFileSync(packagePath, "utf8"));
  } catch {
    return new Set();
  }
}

function dependenciesFromPackageJson(text) {
  const pkg = JSON.parse(text);
  return new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ]);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    agentCommand: null,
    arm: null,
    blockReason: null,
    execute: false,
    limit: null,
    outRoot: "/private/tmp/bald-patch-m1",
    recordBlocked: false,
    recordFile: null,
    runIdPrefix: isoDate(),
    taskId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--agent-command") {
      args.agentCommand = argv[index + 1];
      index += 1;
    } else if (arg === "--arm") {
      args.arm = argv[index + 1];
      index += 1;
    } else if (arg === "--blocker") {
      args.blockReason = argv[index + 1];
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--limit") {
      args.limit = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--out-root") {
      args.outRoot = argv[index + 1];
      index += 1;
    } else if (arg === "--record") {
      args.recordFile = argv[index + 1];
      index += 1;
    } else if (arg === "--record-blocked") {
      args.recordBlocked = true;
    } else if (arg === "--run-id-prefix") {
      args.runIdPrefix = argv[index + 1];
      index += 1;
    } else if (arg === "--task") {
      args.taskId = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = runEval(parseArgs(process.argv.slice(2)));
  for (const row of rows) {
    process.stdout.write(`${JSON.stringify(row)}\n`);
  }
}

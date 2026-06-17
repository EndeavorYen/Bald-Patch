import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { collectDiffMetrics } from "./collect-diff-metrics.mjs";
import { collectScopeLint } from "./scope-lint.mjs";

export function buildStopHookText(metrics, warningCount) {
  return [
    "Bald Patch metrics:",
    `${metrics.files_changed} files,`,
    `+${metrics.lines_added}/-${metrics.lines_deleted} LOC,`,
    `deps ${metrics.package_files_changed ? "yes" : "no"},`,
    `locks ${metrics.lockfiles_changed ? "yes" : "no"},`,
    `warnings ${warningCount}.`,
  ].join(" ");
}

export function buildStopHookOutput({ metrics = null, warnings = [], error = null }) {
  if (error) {
    return {
      continue: true,
      systemMessage: `Bald Patch metrics unavailable: ${error.message}`,
    };
  }

  return {
    continue: true,
    systemMessage: buildStopHookText(metrics, warnings.length),
  };
}

export function runStopHook({ cwd = process.cwd(), base = "main" } = {}) {
  try {
    const metrics = collectDiffMetrics({ base, cwd });
    const scope = collectScopeLint({ base, cwd });
    return buildStopHookOutput({
      metrics,
      warnings: scope.warnings,
    });
  } catch (error) {
    return buildStopHookOutput({ error });
  }
}

function readHookInput() {
  try {
    const input = readFileSync(0, "utf8").trim();
    return input ? JSON.parse(input) : {};
  } catch {
    return {};
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = readHookInput();
  const output = runStopHook({
    cwd: input.cwd || process.cwd(),
  });

  process.stdout.write(`${JSON.stringify(output)}\n`);
}

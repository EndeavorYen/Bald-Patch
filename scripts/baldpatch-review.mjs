import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { collectScopeLint } from "./scope-lint.mjs";

const SOURCE_PATTERN = /\.(c|cc|cpp|cs|css|go|h|java|js|jsx|kt|mjs|php|py|rb|rs|swift|ts|tsx)$/;
const TEST_PATTERN = /(^|\/)(__tests__|test|tests|spec)\//;
const SAFETY_DELETION_PATTERN = /^-.*\b(auth|permission|forbidden|admin|validate|validation|sanitize|csrf|token|password|encrypt|decrypt|rollback|backup)\b/i;

export function reviewPatch({
  files = [],
  diff = "",
  scopeWarnings = [],
} = {}) {
  const findings = [
    ...scopeWarnings.map((warning) => ({
      code: `scope-lint:${warning.code}`,
      severity: severityForScopeWarning(warning.code),
      message: warning.message,
    })),
  ];

  if (changesSource(files) && !changesTest(files)) {
    findings.push({
      code: "missing-focused-test",
      severity: "medium",
      message: "Patch changes source files without a focused test change.",
    });
  }

  if (hasSafetySensitiveDeletion(diff)) {
    findings.push({
      code: "safety-sensitive-deletion",
      severity: "high",
      message: "Patch deletes safety-sensitive logic. Confirm validation, auth, or data-loss protection remains intact.",
    });
  }

  return {
    summary: {
      findings: findings.length,
      advisory: true,
    },
    findings,
  };
}

export function renderReview(review) {
  const lines = [
    "# Bald Patch Review",
    "",
    `Advisory findings: ${review.summary.findings}`,
    "",
  ];

  if (review.findings.length === 0) {
    lines.push("- No advisory findings.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("| Severity | Code | Finding |");
  lines.push("| --- | --- | --- |");

  for (const finding of review.findings) {
    lines.push(
      `| ${finding.severity} | ${finding.code} | ${finding.message} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

function changesSource(files) {
  return files.some((file) => SOURCE_PATTERN.test(file) && !changesTest([file]));
}

function changesTest(files) {
  return files.some((file) => TEST_PATTERN.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file));
}

function hasSafetySensitiveDeletion(diff) {
  return diff
    .split(/\r?\n/)
    .some((line) => !line.startsWith("---") && SAFETY_DELETION_PATTERN.test(line));
}

function severityForScopeWarning(code) {
  if (code === "lockfile-changed" || code === "suspicious-abstraction") {
    return "medium";
  }
  return "low";
}

function git(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }

  return result.stdout.trim();
}

function parseArgs(argv) {
  const args = { base: "main" };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--base") {
      args.base = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const scope = collectScopeLint({ base: args.base, cwd });
  const diff = git(["diff", args.base, "--"], cwd);
  const review = reviewPatch({
    files: scope.files,
    diff,
    scopeWarnings: scope.warnings,
  });

  process.stdout.write(renderReview(review));
}

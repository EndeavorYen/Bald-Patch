import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACKAGE_FILES = new Set([
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "requirements.txt",
]);

const LOCKFILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "Cargo.lock",
  "poetry.lock",
  "uv.lock",
  "go.sum",
]);

const ABSTRACTION_TERMS = [
  "Adapter",
  "Config",
  "Factory",
  "Interface",
  "Manager",
  "Orchestrator",
  "Plugin",
  "Provider",
  "Registry",
  "Strategy",
];

export function lintScope({ files = [], diff = "" }) {
  const warnings = [];

  if (files.some(isPackageFile)) {
    warnings.push({
      code: "dependency-file-changed",
      message: "Package manifest changed. Confirm this did not add an avoidable dependency.",
    });
  }

  if (files.some(isLockfile)) {
    warnings.push({
      code: "lockfile-changed",
      message: "Lockfile changed. Confirm dependency churn is required for the task.",
    });
  }

  const surfaces = new Set(files.map(surfaceFor));
  if (surfaces.size >= 4) {
    warnings.push({
      code: "multi-surface-change",
      message: `Patch touches ${surfaces.size} surfaces: ${[...surfaces].sort().join(", ")}.`,
    });
  }

  const abstractionMatches = findAbstractionTerms(files, diff);
  if (abstractionMatches.length > 0) {
    warnings.push({
      code: "suspicious-abstraction",
      message: `Review whether these abstraction terms are necessary: ${abstractionMatches.join(", ")}.`,
    });
  }

  return warnings;
}

export function collectScopeLint({ base = "main", cwd = process.cwd() } = {}) {
  const trackedFiles = git(["diff", "--name-only", base, "--"], cwd)
    .split(/\r?\n/)
    .filter(Boolean);
  const untrackedFiles = git(
    ["ls-files", "--others", "--exclude-standard"],
    cwd,
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const diff = git(["diff", base, "--"], cwd);

  return {
    files: [...new Set([...trackedFiles, ...untrackedFiles])],
    warnings: lintScope({
      files: [...new Set([...trackedFiles, ...untrackedFiles])],
      diff,
    }),
  };
}

function findAbstractionTerms(files, diff) {
  const haystack = `${files.join("\n")}\n${diff}`;
  return ABSTRACTION_TERMS.filter((term) => {
    const pattern = new RegExp(term);
    return pattern.test(haystack);
  });
}

function surfaceFor(filePath) {
  if (isPackageFile(filePath) || isLockfile(filePath)) {
    return "config";
  }

  if (isTestFile(filePath)) {
    return "test";
  }

  if (/^docs\//.test(filePath)) {
    return "docs";
  }

  if (/^assets\//.test(filePath)) {
    return "assets";
  }

  if (/^evals\//.test(filePath)) {
    return "evals";
  }

  if (/\.(json|ya?ml|toml|ini)$/.test(filePath)) {
    return "config";
  }

  return "source";
}

function isPackageFile(filePath) {
  return PACKAGE_FILES.has(path.basename(filePath));
}

function isLockfile(filePath) {
  return LOCKFILES.has(path.basename(filePath));
}

function isTestFile(filePath) {
  return /(^|\/)(__tests__|test|tests|spec)\//.test(filePath)
    || /\.(test|spec)\.[cm]?[jt]sx?$/.test(filePath);
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
  const args = { base: "main", json: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") {
      args.base = argv[index + 1];
      index += 1;
    } else if (arg === "--json") {
      args.json = true;
    }
  }

  return args;
}

function printText(result) {
  if (result.warnings.length === 0) {
    console.log("No scope warnings.");
    return;
  }

  for (const warning of result.warnings) {
    console.log(`${warning.code}: ${warning.message}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const result = collectScopeLint({ base: args.base });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printText(result);
  }
}

import { readFileSync, statSync } from "node:fs";
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

const SOURCE_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".css",
  ".go",
  ".h",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".mjs",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".swift",
  ".ts",
  ".tsx",
]);

export function parseNumstat(output) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      return {
        path: parts.slice(2).join("\t"),
        added: parseGitCount(parts[0]),
        deleted: parseGitCount(parts[1]),
      };
    });
}

export function parseNameStatus(output) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const status = parts[0];

      if (status.startsWith("R") || status.startsWith("C")) {
        return { status, path: parts[2], oldPath: parts[1] };
      }

      return { status, path: parts[1] };
    });
}

export function summarizeDiff({ numstat = "", nameStatus = "" }) {
  const numstatRows = parseNumstat(numstat);
  const statusRows = parseNameStatus(nameStatus);
  const changedPaths = new Set([
    ...numstatRows.map((row) => row.path),
    ...statusRows.map((row) => row.path),
  ]);
  const paths = [...changedPaths];

  return {
    files_changed: paths.length,
    new_files: statusRows.filter((row) => row.status === "A").length,
    lines_added: sum(numstatRows.map((row) => row.added)),
    lines_deleted: sum(numstatRows.map((row) => row.deleted)),
    package_files_changed: paths.some(isPackageFile),
    lockfiles_changed: paths.some(isLockfile),
    test_files_changed: paths.filter(isTestFile).length,
    source_files_changed: paths.filter(isSourceFile).length,
  };
}

export function collectDiffMetrics({ base = "main", cwd = process.cwd() } = {}) {
  const numstat = git(["diff", "--numstat", base, "--"], cwd);
  const nameStatus = git(["diff", "--name-status", base, "--"], cwd);
  const untrackedFiles = git(
    ["ls-files", "--others", "--exclude-standard"],
    cwd,
  )
    .split(/\r?\n/)
    .filter(Boolean);

  return summarizeDiff({
    numstat: appendUntrackedNumstat(numstat, untrackedFiles, cwd),
    nameStatus: appendUntrackedNameStatus(nameStatus, untrackedFiles),
  });
}

function appendUntrackedNameStatus(nameStatus, files) {
  const extra = files.map((file) => `A\t${file}`).join("\n");
  return [nameStatus, extra].filter(Boolean).join("\n");
}

function appendUntrackedNumstat(numstat, files, cwd) {
  const extra = files
    .map((file) => `${countTextLines(path.join(cwd, file))}\t0\t${file}`)
    .join("\n");
  return [numstat, extra].filter(Boolean).join("\n");
}

function countTextLines(filePath) {
  try {
    if (!statSync(filePath).isFile()) {
      return 0;
    }

    const buffer = readFileSync(filePath);
    if (buffer.includes(0)) {
      return 0;
    }

    const text = buffer.toString("utf8");
    if (text.length === 0) {
      return 0;
    }

    return text.endsWith("\n")
      ? text.split("\n").length - 1
      : text.split("\n").length;
  } catch {
    return 0;
  }
}

function parseGitCount(value) {
  return value === "-" ? 0 : Number.parseInt(value, 10);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
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

function isSourceFile(filePath) {
  if (isTestFile(filePath) || isPackageFile(filePath) || isLockfile(filePath)) {
    return false;
  }

  if (/^(assets|docs|evals)\//.test(filePath)) {
    return false;
  }

  return SOURCE_EXTENSIONS.has(path.extname(filePath));
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

function printText(summary) {
  for (const [key, value] of Object.entries(summary)) {
    console.log(`${key}: ${value}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const summary = collectDiffMetrics({ base: args.base });

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printText(summary);
  }
}

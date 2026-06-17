import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { parseJsonl } from "./score-run.mjs";

export function applyBlindReview({
  answers,
  key,
  runs,
}) {
  const decisions = answers.map((answer) => decodeAnswer(answer, key));
  const preferredRunIds = new Set(decisions.map((decision) => decision.run_id));
  const answeredTaskIds = new Set(decisions.map((decision) => decision.task_id));

  return {
    decisions,
    runs: runs.map((run) => {
      if (!answeredTaskIds.has(run.task_id)) {
        return run;
      }
      return {
        ...run,
        reviewer_preferred: preferredRunIds.has(run.run_id),
      };
    }),
  };
}

export function summarizeBlindReview(decisions) {
  const counts = new Map();
  const lines = [
    "# Blind Review Decoded Summary",
    "",
    "| Task | Preferred arm | Preferred patch | Confidence | Reason |",
    "| --- | --- | --- | ---: | --- |",
  ];

  for (const decision of decisions) {
    counts.set(decision.arm, (counts.get(decision.arm) || 0) + 1);
    lines.push(
      `| ${markdownCell(decision.task_id)} | ${markdownCell(decision.arm)} | ${markdownCell(decision.patch)} | ${markdownCell(decision.confidence)} | ${markdownCell(decision.reason)} |`,
    );
  }

  lines.push("", "## Preference Counts", "");
  for (const arm of [...counts.keys()].sort()) {
    lines.push(`- ${arm}: ${counts.get(arm)}`);
  }

  lines.push("");
  return lines.join("\n");
}

function decodeAnswer(answer, key) {
  const match = key.find((entry) => {
    return entry.task_id === answer.task_id
      && entry.patch === answer.preferred_patch;
  });
  if (!match) {
    throw new Error(`No key entry for ${answer.task_id} patch ${answer.preferred_patch}`);
  }

  return {
    task_id: answer.task_id,
    patch: answer.preferred_patch,
    arm: match.arm,
    run_id: match.run_id,
    confidence: answer.confidence,
    reason: answer.reason,
  };
}

function recordsJsonl(runs) {
  return `${runs.map((run) => JSON.stringify(run)).join("\n")}\n`;
}

function markdownCell(value) {
  return String(value).replace(/\r?\n/g, " ").replaceAll("|", "\\|");
}

function parseArgs(argv) {
  const args = {
    answers: null,
    key: null,
    outputRuns: null,
    outputSummary: null,
    runs: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--answers") {
      args.answers = argv[index + 1];
      index += 1;
    } else if (arg === "--key") {
      args.key = argv[index + 1];
      index += 1;
    } else if (arg === "--output-runs") {
      args.outputRuns = argv[index + 1];
      index += 1;
    } else if (arg === "--output-summary") {
      args.outputSummary = argv[index + 1];
      index += 1;
    } else if (arg === "--runs") {
      args.runs = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.answers || !args.key || !args.runs) {
    throw new Error("--answers, --key, and --runs are required");
  }
  const result = applyBlindReview({
    answers: JSON.parse(readFileSync(args.answers, "utf8")),
    key: JSON.parse(readFileSync(args.key, "utf8")),
    runs: parseJsonl(readFileSync(args.runs, "utf8")),
  });
  const summary = summarizeBlindReview(result.decisions);

  if (args.outputRuns) {
    writeFileSync(args.outputRuns, recordsJsonl(result.runs));
  }
  if (args.outputSummary) {
    writeFileSync(args.outputSummary, summary);
  }
  if (!args.outputRuns && !args.outputSummary) {
    process.stdout.write(summary);
  }
}

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseJsonl } from "./score-run.mjs";

export function applyBlindReview({
  answers,
  answerSets,
  key,
  runs,
}) {
  const normalizedAnswerSets = normalizeAnswerSets({ answers, answerSets });
  const keyByTask = groupKeyByTask(key);
  const reviewsByRunId = new Map();
  const decisions = [];

  for (const answerSet of normalizedAnswerSets) {
    for (const answer of answerSet.answers) {
      const taskKey = keyByTask.get(answer.task_id) || [];
      const decision = decodeAnswer(answer, taskKey, answerSet.reviewer_id);
      decisions.push(decision);

      for (const entry of taskKey) {
        addRunReview(reviewsByRunId, entry.run_id, {
          preference: {
            reviewer_id: answerSet.reviewer_id,
            preferred: entry.patch === answer.preferred_patch,
            confidence: answer.confidence ?? null,
          },
        });
      }

      for (const assessment of decodeAssessments(answer, taskKey, answerSet.reviewer_id)) {
        addRunReview(reviewsByRunId, assessment.run_id, {
          assessment,
        });
      }
    }
  }

  return {
    decisions,
    runs: runs.map((run) => {
      const review = reviewsByRunId.get(run.run_id);
      if (!review) {
        return run;
      }
      const preferenceValues = review.preferences.map((preference) => preference.preferred);
      const reworkValues = review.assessments
        .map((assessment) => assessment.expected_rework_minutes)
        .filter(isNumber);

      return {
        ...run,
        reviewer_preferred: preferenceValues.length === 0
          ? run.reviewer_preferred
          : preferenceValues.filter(Boolean).length > preferenceValues.length / 2,
        human_rework_minutes: reworkValues.length === 0
          ? run.human_rework_minutes
          : median(reworkValues),
        reviewer_preferences: [
          ...(Array.isArray(run.reviewer_preferences) ? run.reviewer_preferences : []),
          ...review.preferences,
        ],
        reviewer_assessments: [
          ...(Array.isArray(run.reviewer_assessments) ? run.reviewer_assessments : []),
          ...review.assessments.map(({ run_id: _runId, patch: _patch, ...assessment }) => assessment),
        ],
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

function normalizeAnswerSets({
  answers,
  answerSets,
}) {
  if (answerSets) {
    return answerSets.map((answerSet, index) => ({
      reviewer_id: answerSet.reviewer_id || `reviewer-${index + 1}`,
      answers: answerSet.answers,
    }));
  }
  return [
    {
      reviewer_id: "reviewer-1",
      answers,
    },
  ];
}

function groupKeyByTask(key) {
  const grouped = new Map();
  for (const entry of key) {
    if (!grouped.has(entry.task_id)) {
      grouped.set(entry.task_id, []);
    }
    grouped.get(entry.task_id).push(entry);
  }
  return grouped;
}

function decodeAnswer(answer, taskKey, reviewerId) {
  const match = taskKey.find((entry) => entry.patch === answer.preferred_patch);
  if (!match) {
    throw new Error(`No key entry for ${answer.task_id} patch ${answer.preferred_patch}`);
  }

  return {
    reviewer_id: reviewerId,
    task_id: answer.task_id,
    patch: answer.preferred_patch,
    arm: match.arm,
    run_id: match.run_id,
    confidence: answer.confidence,
    reason: answer.reason,
  };
}

function decodeAssessments(answer, taskKey, reviewerId) {
  if (answer.patches) {
    return taskKey.map((entry) => {
      const patchAssessment = answer.patches[entry.patch];
      if (!patchAssessment) {
        throw new Error(`Missing assessment for ${answer.task_id} patch ${entry.patch}`);
      }
      return normalizeAssessment({
        assessment: patchAssessment,
        entry,
        reviewerId,
      });
    });
  }

  if (!hasTopLevelAssessment(answer)) {
    return [];
  }

  const preferredEntry = taskKey.find((entry) => entry.patch === answer.preferred_patch);
  return [
    normalizeAssessment({
      assessment: answer,
      entry: preferredEntry,
      reviewerId,
    }),
  ];
}

function normalizeAssessment({
  assessment,
  entry,
  reviewerId,
}) {
  return {
    reviewer_id: reviewerId,
    run_id: entry.run_id,
    patch: entry.patch,
    decision: assessment.decision ?? null,
    expected_rework_minutes: isNumber(assessment.expected_rework_minutes)
      ? assessment.expected_rework_minutes
      : null,
    scores: assessment.scores || {},
    dependency_judgment: assessment.dependency_judgment ?? null,
    abstraction_judgment: assessment.abstraction_judgment ?? null,
  };
}

function hasTopLevelAssessment(answer) {
  return "decision" in answer
    || "expected_rework_minutes" in answer
    || "scores" in answer
    || "dependency_judgment" in answer
    || "abstraction_judgment" in answer;
}

function addRunReview(reviewsByRunId, runId, {
  preference = null,
  assessment = null,
}) {
  if (!reviewsByRunId.has(runId)) {
    reviewsByRunId.set(runId, {
      preferences: [],
      assessments: [],
    });
  }
  const review = reviewsByRunId.get(runId);
  if (preference) {
    review.preferences.push(preference);
  }
  if (assessment) {
    review.assessments.push(assessment);
  }
}

function recordsJsonl(runs) {
  return `${runs.map((run) => JSON.stringify(run)).join("\n")}\n`;
}

function markdownCell(value) {
  return String(value).replace(/\r?\n/g, " ").replaceAll("|", "\\|");
}

function median(values) {
  const numbers = values
    .filter(isNumber)
    .sort((left, right) => left - right);
  if (numbers.length === 0) {
    return null;
  }
  const middle = Math.floor(numbers.length / 2);
  if (numbers.length % 2 === 1) {
    return numbers[middle];
  }
  return Number(((numbers[middle - 1] + numbers[middle]) / 2).toFixed(2));
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function readAnswerSet(file, index) {
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  if (Array.isArray(parsed)) {
    return {
      reviewer_id: path.basename(file, path.extname(file)),
      answers: parsed,
    };
  }
  if (Array.isArray(parsed.answers)) {
    return {
      reviewer_id: parsed.reviewer_id || path.basename(file, path.extname(file)) || `reviewer-${index + 1}`,
      answers: parsed.answers,
    };
  }
  throw new Error(`Invalid answer file: ${file}`);
}

function parseArgs(argv) {
  const args = {
    answers: [],
    key: null,
    outputRuns: null,
    outputSummary: null,
    runs: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--answers") {
      args.answers.push(argv[index + 1]);
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
  if (args.answers.length === 0 || !args.key || !args.runs) {
    throw new Error("--answers, --key, and --runs are required");
  }
  const result = applyBlindReview({
    answerSets: args.answers.map(readAnswerSet),
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

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { after, describe, it } from "node:test";

import {
  applyBlindReview,
  summarizeBlindReview,
} from "../scripts/apply-blind-review.mjs";

const tmpRoot = mkdtempSync(path.join(tmpdir(), "bald-patch-apply-review-test-"));

after(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe("apply-blind-review", () => {
  it("decodes preferred patches without leaking the key into run records", () => {
    const result = applyBlindReview({
      answers: sampleAnswers(),
      key: sampleKey(),
      runs: sampleRuns(),
    });

    assert.deepEqual(result.runs.map((run) => ({
      run_id: run.run_id,
      reviewer_preferred: run.reviewer_preferred,
    })), [
      { run_id: "task-a-baseline", reviewer_preferred: false },
      { run_id: "task-a-skill", reviewer_preferred: true },
      { run_id: "task-b-baseline", reviewer_preferred: true },
      { run_id: "task-b-skill", reviewer_preferred: false },
    ]);
    assert.equal(JSON.stringify(result.runs).includes("Patch A looked safer"), false);
    assert.equal(JSON.stringify(result.runs).includes("\"patch\""), false);
  });

  it("summarizes reviewer preferences by task and arm", () => {
    const summary = summarizeBlindReview(applyBlindReview({
      answers: sampleAnswers(),
      key: sampleKey(),
      runs: sampleRuns(),
    }).decisions);

    assert.equal(
      summary,
      [
        "# Blind Review Decoded Summary",
        "",
        "| Task | Preferred arm | Preferred patch | Confidence | Reason |",
        "| --- | --- | --- | ---: | --- |",
        "| task-a | skill | B | 5 | Patch B is smaller. |",
        "| task-b | baseline | A | 4 | Patch A looked safer \\| simpler. |",
        "",
        "## Preference Counts",
        "",
        "- baseline: 1",
        "- skill: 1",
        "",
      ].join("\n"),
    );
  });

  it("aggregates multiple reviewers with per-patch rework and rubric fields", () => {
    const result = applyBlindReview({
      answerSets: [
        {
          reviewer_id: "reviewer-a",
          answers: [
            richAnswer({
              reviewerPreferredPatch: "B",
              baselineRework: 8,
              skillRework: 2,
            }),
          ],
        },
        {
          reviewer_id: "reviewer-b",
          answers: [
            richAnswer({
              reviewerPreferredPatch: "B",
              baselineRework: 6,
              skillRework: 3,
            }),
          ],
        },
      ],
      key: sampleKey().filter((entry) => entry.task_id === "task-a"),
      runs: sampleRuns().filter((run) => run.task_id === "task-a"),
    });

    const baseline = result.runs.find((run) => run.run_id === "task-a-baseline");
    const skill = result.runs.find((run) => run.run_id === "task-a-skill");

    assert.equal(baseline.reviewer_preferred, false);
    assert.equal(baseline.human_rework_minutes, 7);
    assert.deepEqual(
      baseline.reviewer_preferences.map((preference) => preference.preferred),
      [false, false],
    );
    assert.deepEqual(
      baseline.reviewer_assessments.map((assessment) => assessment.expected_rework_minutes),
      [8, 6],
    );
    assert.equal(baseline.reviewer_assessments[0].decision, "request-changes");
    assert.equal(baseline.reviewer_assessments[0].scores.correctness, 3);
    assert.equal(baseline.reviewer_assessments[0].dependency_judgment, "avoidable");

    assert.equal(skill.reviewer_preferred, true);
    assert.equal(skill.human_rework_minutes, 2.5);
    assert.deepEqual(
      skill.reviewer_preferences.map((preference) => preference.preferred),
      [true, true],
    );
    assert.deepEqual(
      skill.reviewer_assessments.map((assessment) => assessment.expected_rework_minutes),
      [2, 3],
    );
    assert.equal(skill.reviewer_assessments[0].decision, "accept");
    assert.equal(skill.reviewer_assessments[0].abstraction_judgment, "underbuilt");
  });

  it("rejects rich answers that omit a patch assessment", () => {
    assert.throws(
      () => applyBlindReview({
        answerSets: [
          {
            reviewer_id: "reviewer-a",
            answers: [
              {
                task_id: "task-a",
                preferred_patch: "B",
                patches: {
                  B: {
                    decision: "accept",
                    expected_rework_minutes: 2,
                  },
                },
              },
            ],
          },
        ],
        key: sampleKey().filter((entry) => entry.task_id === "task-a"),
        runs: sampleRuns().filter((run) => run.task_id === "task-a"),
      }),
      /Missing assessment for task-a patch A/,
    );
  });

  it("ingests multiple answer files from the CLI", () => {
    const runsFile = path.join(tmpRoot, "runs.jsonl");
    const keyFile = path.join(tmpRoot, "key.json");
    const firstAnswersFile = path.join(tmpRoot, "reviewer-a.json");
    const secondAnswersFile = path.join(tmpRoot, "reviewer-b.json");
    const outputRunsFile = path.join(tmpRoot, "reviewed.jsonl");

    writeFileSync(runsFile, `${sampleRuns()
      .filter((run) => run.task_id === "task-a")
      .map((run) => JSON.stringify(run))
      .join("\n")}\n`);
    writeFileSync(keyFile, JSON.stringify(sampleKey().filter((entry) => entry.task_id === "task-a")));
    writeFileSync(firstAnswersFile, JSON.stringify([
      richAnswer({
        reviewerPreferredPatch: "B",
        baselineRework: 8,
        skillRework: 2,
      }),
    ]));
    writeFileSync(secondAnswersFile, JSON.stringify({
      reviewer_id: "reviewer-b",
      answers: [
        richAnswer({
          reviewerPreferredPatch: "B",
          baselineRework: 6,
          skillRework: 3,
        }),
      ],
    }));

    const cli = spawnSync(process.execPath, [
      "scripts/apply-blind-review.mjs",
      "--runs",
      runsFile,
      "--key",
      keyFile,
      "--answers",
      firstAnswersFile,
      "--answers",
      secondAnswersFile,
      "--output-runs",
      outputRunsFile,
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    assert.equal(cli.status, 0, cli.stderr || cli.stdout);

    const reviewedRuns = readFileSync(outputRunsFile, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const skill = reviewedRuns.find((run) => run.run_id === "task-a-skill");

    assert.equal(skill.reviewer_preferences.length, 2);
    assert.equal(skill.reviewer_assessments.length, 2);
    assert.equal(skill.human_rework_minutes, 2.5);
    assert.equal(JSON.stringify(reviewedRuns).includes("\"patch\""), false);
  });
});

function sampleRuns() {
  return [
    { run_id: "task-a-baseline", task_id: "task-a", arm: "baseline" },
    { run_id: "task-a-skill", task_id: "task-a", arm: "skill" },
    { run_id: "task-b-baseline", task_id: "task-b", arm: "baseline" },
    { run_id: "task-b-skill", task_id: "task-b", arm: "skill" },
  ];
}

function sampleKey() {
  return [
    {
      task_id: "task-a",
      patch: "A",
      arm: "baseline",
      run_id: "task-a-baseline",
    },
    {
      task_id: "task-a",
      patch: "B",
      arm: "skill",
      run_id: "task-a-skill",
    },
    {
      task_id: "task-b",
      patch: "A",
      arm: "baseline",
      run_id: "task-b-baseline",
    },
    {
      task_id: "task-b",
      patch: "B",
      arm: "skill",
      run_id: "task-b-skill",
    },
  ];
}

function sampleAnswers() {
  return [
    {
      task_id: "task-a",
      preferred_patch: "B",
      confidence: 5,
      reason: "Patch B is smaller.",
    },
    {
      task_id: "task-b",
      preferred_patch: "A",
      confidence: 4,
      reason: "Patch A looked safer | simpler.",
    },
  ];
}

function richAnswer({
  reviewerPreferredPatch,
  baselineRework,
  skillRework,
}) {
  return {
    task_id: "task-a",
    preferred_patch: reviewerPreferredPatch,
    confidence: 5,
    reason: "Patch B needs less rework.",
    patches: {
      A: {
        decision: "request-changes",
        expected_rework_minutes: baselineRework,
        scores: {
          correctness: 3,
          safety: 4,
          tests: 3,
          maintainability: 2,
        },
        dependency_judgment: "avoidable",
        abstraction_judgment: "avoidable",
      },
      B: {
        decision: "accept",
        expected_rework_minutes: skillRework,
        scores: {
          correctness: 4,
          safety: 4,
          tests: 4,
          maintainability: 4,
        },
        dependency_judgment: "none",
        abstraction_judgment: "underbuilt",
      },
    },
  };
}

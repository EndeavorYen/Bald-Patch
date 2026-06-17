import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyBlindReview,
  summarizeBlindReview,
} from "../scripts/apply-blind-review.mjs";

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

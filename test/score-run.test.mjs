import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseJsonl,
  renderMarkdownReport,
  summarizeRuns,
} from "../scripts/score-run.mjs";

describe("score-run", () => {
  it("parses JSONL records and ignores blank lines", () => {
    const runs = parseJsonl(`
{"run_id":"a","arm":"baseline","success":true}

{"run_id":"b","arm":"skill","success":false}
`);

    assert.deepEqual(runs, [
      { run_id: "a", arm: "baseline", success: true },
      { run_id: "b", arm: "skill", success: false },
    ]);
  });

  it("summarizes runs by arm with gates and regression warnings", () => {
    const summary = summarizeRuns(sampleRuns());

    assert.deepEqual(summary.arms, [
      {
        arm: "baseline",
        runs: 2,
        success_count: 1,
        median_files: 3,
        median_loc: 52.5,
        dependency_additions: 1,
        median_tool_calls: 9,
        median_elapsed_ms: 90000,
        scope_warnings: 1,
        reviewer_preference_rate: 0,
        median_human_rework_minutes: 2,
        underbuild_findings: 0,
      },
      {
        arm: "skill",
        runs: 2,
        success_count: 2,
        median_files: 1.5,
        median_loc: 13,
        dependency_additions: 0,
        median_tool_calls: 11.5,
        median_elapsed_ms: 91500,
        scope_warnings: 0,
        reviewer_preference_rate: 1,
        median_human_rework_minutes: 5.5,
        underbuild_findings: 0,
      },
    ]);

    assert.deepEqual(summary.hard_gate_failures, [
      {
        run_id: "baseline-task-b",
        arm: "baseline",
        task_id: "task-b",
        gates: ["success", "tests_passed"],
      },
    ]);
    assert.deepEqual(summary.regression_warnings, [
      "skill has smaller median LOC than baseline but higher human rework.",
    ]);
    assert.deepEqual(summary.acceptance_checks, [
      {
        gate: "correctness_not_worse",
        status: "pass",
        detail: "skill success 2/2 vs baseline 1/2",
      },
      {
        gate: "median_loc_reduction",
        status: "pass",
        detail: "skill median LOC 13 vs baseline 52.5 (75% lower)",
      },
      {
        gate: "dependency_reduction",
        status: "pass",
        detail: "skill dependency additions 0 vs baseline 1 (100% lower)",
      },
      {
        gate: "tool_call_budget",
        status: "fail",
        detail: "skill median tool calls 11.5 vs baseline 9 (28% higher)",
      },
      {
        gate: "reviewer_preference",
        status: "pass",
        detail: "skill reviewer preference 100% (threshold 60%)",
      },
    ]);
  });

  it("renders a deterministic markdown report", () => {
    const markdown = renderMarkdownReport(summarizeRuns(sampleRuns()), {
      title: "Bald Patch Eval Report - 2026-06-17",
    });

    assert.equal(
      markdown,
      [
        "# Bald Patch Eval Report - 2026-06-17",
        "",
        "## Summary",
        "",
        "| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
        "| baseline | 1/2 | 3 | 52.5 | 1 | 9 | 90000 | 1 | 0% | 2 | 0 |",
        "| skill | 2/2 | 1.5 | 13 | 0 | 11.5 | 91500 | 0 | 100% | 5.5 | 0 |",
        "",
        "## Reviewer Agreement",
        "",
        "- Not available",
        "",
        "## Acceptance Check",
        "",
        "| Gate | Status | Detail |",
        "| --- | --- | --- |",
        "| correctness_not_worse | pass | skill success 2/2 vs baseline 1/2 |",
        "| median_loc_reduction | pass | skill median LOC 13 vs baseline 52.5 (75% lower) |",
        "| dependency_reduction | pass | skill dependency additions 0 vs baseline 1 (100% lower) |",
        "| tool_call_budget | fail | skill median tool calls 11.5 vs baseline 9 (28% higher) |",
        "| reviewer_preference | pass | skill reviewer preference 100% (threshold 60%) |",
        "",
        "## Acceptance Gate Failures",
        "",
        "| Gate | Detail |",
        "| --- | --- |",
        "| tool_call_budget | skill median tool calls 11.5 vs baseline 9 (28% higher) |",
        "",
        "## Hard Gate Failures",
        "",
        "| Run | Arm | Task | Gates |",
        "| --- | --- | --- | --- |",
        "| baseline-task-b | baseline | task-b | success, tests_passed |",
        "",
        "## Blocked Runs",
        "",
        "- None",
        "",
        "## Regression Warnings",
        "",
        "- skill has smaller median LOC than baseline but higher human rework.",
        "",
      ].join("\n"),
    );
  });

  it("reports blocked runs separately from scored runs", () => {
    const summary = summarizeRuns([
      {
        run_id: "blocked-parser-baseline",
        task_id: "parser-edge-case",
        arm: "baseline",
        blocked: true,
        block_reason: "external Codex execution was not approved",
      },
      {
        run_id: "skill-parser",
        task_id: "parser-edge-case",
        arm: "skill",
        success: true,
        tests_passed: true,
        requirements_met: true,
        files_changed: 2,
        lines_added: 8,
        lines_deleted: 1,
        dependencies_added: [],
        tool_calls: null,
        elapsed_ms: 1000,
        scope_violations: [],
        human_rework_minutes: null,
        reviewer_preferred: null,
      },
    ]);

    assert.deepEqual(summary.blocked_runs, [
      {
        run_id: "blocked-parser-baseline",
        arm: "baseline",
        task_id: "parser-edge-case",
        reason: "external Codex execution was not approved",
      },
    ]);
    assert.deepEqual(summary.hard_gate_failures, []);
    assert.deepEqual(summary.arms.map((arm) => arm.arm), ["skill"]);

    const markdown = renderMarkdownReport(summary, {
      title: "Blocked Smoke",
    });

    assert.match(markdown, /## Blocked Runs/);
    assert.match(markdown, /blocked-parser-baseline/);
    assert.match(markdown, /external Codex execution was not approved/);
  });

  it("renders a clear summary when every run is blocked", () => {
    const markdown = renderMarkdownReport(summarizeRuns([
      {
        run_id: "blocked-parser-baseline",
        task_id: "parser-edge-case",
        arm: "baseline",
        blocked: true,
        block_reason: "external Codex execution was not approved",
      },
    ]));

    assert.match(markdown, /## Summary\n\n- No scored runs\./);
    assert.match(markdown, /## Acceptance Check\n\n- Not available/);
  });

  it("compares Bald Patch against both M2 control arms", () => {
    const summary = summarizeRuns(sampleM2Runs());

    assert.deepEqual(
      summary.acceptance_checks.map((check) => check.gate),
      [
        "correctness_not_worse_vs_natural-baseline",
        "median_loc_reduction_vs_natural-baseline",
        "dependency_reduction_vs_natural-baseline",
        "tool_call_budget_vs_natural-baseline",
        "reviewer_preference_vs_natural-baseline",
        "human_rework_not_worse_vs_natural-baseline",
        "underbuild_risk_vs_natural-baseline",
        "correctness_not_worse_vs_prompt-control",
        "median_loc_reduction_vs_prompt-control",
        "dependency_reduction_vs_prompt-control",
        "tool_call_budget_vs_prompt-control",
        "reviewer_preference_vs_prompt-control",
        "human_rework_not_worse_vs_prompt-control",
        "underbuild_risk_vs_prompt-control",
      ],
    );
    assert.match(
      renderMarkdownReport(summary),
      /baldpatch-skill success 2\/2 vs prompt-control 2\/2/,
    );
  });

  it("describes tool-call decreases as lower in acceptance details", () => {
    const summary = summarizeRuns([
      {
        run_id: "control",
        task_id: "task-a",
        arm: "natural-baseline",
        success: true,
        tests_passed: true,
        requirements_met: true,
        files_changed: 1,
        lines_added: 1,
        lines_deleted: 0,
        dependencies_added: [],
        tool_calls: 20,
        elapsed_ms: 1000,
        scope_violations: [],
      },
      {
        run_id: "target",
        task_id: "task-a",
        arm: "baldpatch-skill",
        success: true,
        tests_passed: true,
        requirements_met: true,
        files_changed: 1,
        lines_added: 1,
        lines_deleted: 0,
        dependencies_added: [],
        tool_calls: 17,
        elapsed_ms: 1000,
        scope_violations: [],
      },
    ]);

    assert.equal(
      summary.acceptance_checks.find((check) => check.gate === "tool_call_budget_vs_natural-baseline").detail,
      "baldpatch-skill median tool calls 17 vs natural-baseline 20 (15% lower)",
    );
  });

  it("describes LOC increases as higher in acceptance details", () => {
    const summary = summarizeRuns([
      {
        run_id: "control",
        task_id: "task-a",
        arm: "natural-baseline",
        success: true,
        tests_passed: true,
        requirements_met: true,
        files_changed: 1,
        lines_added: 16,
        lines_deleted: 0,
        dependencies_added: [],
        tool_calls: 10,
        elapsed_ms: 1000,
        scope_violations: [],
      },
      {
        run_id: "target",
        task_id: "task-a",
        arm: "baldpatch-skill",
        success: true,
        tests_passed: true,
        requirements_met: true,
        files_changed: 1,
        lines_added: 17,
        lines_deleted: 0,
        dependencies_added: [],
        tool_calls: 10,
        elapsed_ms: 1000,
        scope_violations: [],
      },
    ]);

    assert.equal(
      summary.acceptance_checks.find((check) => check.gate === "median_loc_reduction_vs_natural-baseline").detail,
      "baldpatch-skill median LOC 17 vs natural-baseline 16 (6% higher)",
    );
  });

  it("reports multi-reviewer preference, rework, agreement, and underbuild findings", () => {
    const summary = summarizeRuns(sampleMultiReviewerRuns());
    const skill = summary.arms.find((arm) => arm.arm === "baldpatch-skill");

    assert.equal(skill.reviewer_preference_rate, 0.75);
    assert.equal(skill.median_human_rework_minutes, 3.5);
    assert.equal(skill.underbuild_findings, 1);
    assert.deepEqual(summary.reviewer_agreement, {
      tasks: 2,
      unanimous_tasks: 1,
      average_agreement_rate: 0.75,
      by_task: [
        {
          task_id: "task-1",
          reviewer_votes: 2,
          winning_arm: "baldpatch-skill",
          agreement_rate: 1,
        },
        {
          task_id: "task-2",
          reviewer_votes: 2,
          winning_arm: "baldpatch-skill",
          agreement_rate: 0.5,
        },
      ],
    });

    const markdown = renderMarkdownReport(summary);
    assert.match(markdown, /Median rework min/);
    assert.match(markdown, /Underbuild findings/);
    assert.match(markdown, /## Reviewer Agreement/);
    assert.match(markdown, /Average agreement: 75%/);
  });

  it("reports M4 pairwise canary gates against a same-day M3 skill rerun", () => {
    const summary = summarizeRuns(sampleM4PairwiseRuns());

    assert.deepEqual(
      summary.acceptance_checks.map((check) => [check.gate, check.status]),
      [
        ["m4_success_6_of_6", "pass"],
        ["m4_pairwise_task_wins_vs_m3_skill", "pass"],
        ["m4_pairwise_votes_vs_m3_skill", "pass"],
        ["m4_no_unanimous_loss_vs_m3_skill", "pass"],
        ["m4_median_loc_not_higher_vs_m3_skill", "pass"],
        ["m4_tool_call_budget_vs_m3_skill", "pass"],
        ["m4_human_rework_not_worse_vs_m3_skill", "pass"],
        ["m4_underbuild_risk_not_worse_vs_m3_skill", "pass"],
      ],
    );
    assert.equal(
      summary.acceptance_checks.find((check) => check.gate === "m4_pairwise_votes_vs_m3_skill").detail,
      "m4-reviewer-proof-control received 12/18 reviewer votes vs m3-baldpatch-skill-rerun",
    );
  });

  it("reports M7 pairwise gates against the old skill", () => {
    const summary = summarizeRuns(sampleM7PairwiseRuns());

    assert.deepEqual(
      summary.acceptance_checks.map((check) => [check.gate, check.status]),
      [
        ["m7_correctness_not_worse_vs_old_skill", "pass"],
        ["m7_pairwise_task_wins_vs_old_skill", "pass"],
        ["m7_pairwise_votes_vs_old_skill", "pass"],
        ["m7_prior_loss_recovery_vs_old_skill", "pass"],
        ["m7_regression_canaries_vs_old_skill", "pass"],
        ["m7_human_rework_not_worse_vs_old_skill", "pass"],
        ["m7_underbuild_risk_not_worse_vs_old_skill", "pass"],
        ["m7_median_loc_not_higher_unless_rework_improves_vs_old_skill", "pass"],
        ["m7_tool_call_budget_vs_old_skill", "pass"],
      ],
    );
    assert.equal(
      summary.acceptance_checks.find((check) => check.gate === "m7_pairwise_votes_vs_old_skill").detail,
      "revised-baldpatch-skill received 18/30 reviewer votes vs old-baldpatch-skill",
    );
    assert.equal(
      summary.acceptance_checks.find((check) => check.gate === "m7_prior_loss_recovery_vs_old_skill").detail,
      "revised-baldpatch-skill won 6/8 prior M5 loss tasks vs old-baldpatch-skill",
    );
  });
});

function sampleRuns() {
  return [
    {
      run_id: "baseline-task-a",
      task_id: "task-a",
      arm: "baseline",
      success: true,
      tests_passed: true,
      requirements_met: true,
      files_changed: 4,
      lines_added: 70,
      lines_deleted: 10,
      dependencies_added: ["lodash"],
      tool_calls: 10,
      elapsed_ms: 100000,
      scope_violations: ["dependency-file-changed"],
      human_rework_minutes: 2,
      reviewer_preferred: false,
    },
    {
      run_id: "baseline-task-b",
      task_id: "task-b",
      arm: "baseline",
      success: false,
      tests_passed: false,
      requirements_met: true,
      files_changed: 2,
      lines_added: 20,
      lines_deleted: 5,
      dependencies_added: [],
      tool_calls: 8,
      elapsed_ms: 80000,
      scope_violations: [],
      human_rework_minutes: 2,
      reviewer_preferred: false,
    },
    {
      run_id: "skill-task-a",
      task_id: "task-a",
      arm: "skill",
      success: true,
      tests_passed: true,
      requirements_met: true,
      files_changed: 2,
      lines_added: 12,
      lines_deleted: 4,
      dependencies_added: [],
      tool_calls: 11,
      elapsed_ms: 95000,
      scope_violations: [],
      human_rework_minutes: 5,
      reviewer_preferred: true,
    },
    {
      run_id: "skill-task-b",
      task_id: "task-b",
      arm: "skill",
      success: true,
      tests_passed: true,
      requirements_met: true,
      files_changed: 1,
      lines_added: 8,
      lines_deleted: 2,
      dependencies_added: [],
      tool_calls: 12,
      elapsed_ms: 88000,
      scope_violations: [],
      human_rework_minutes: 6,
      reviewer_preferred: true,
    },
  ];
}

function sampleM2Runs() {
  return [
    ...m2Rows("natural-baseline", {
      lines: [40, 60],
      reviewerPreferred: [false, false],
      toolCalls: [10, 12],
    }),
    ...m2Rows("prompt-control", {
      lines: [20, 22],
      reviewerPreferred: [false, false],
      toolCalls: [8, 10],
    }),
    ...m2Rows("baldpatch-skill", {
      lines: [12, 16],
      reviewerPreferred: [true, true],
      toolCalls: [9, 9],
    }),
  ];
}

function m2Rows(arm, {
  lines,
  reviewerPreferred,
  toolCalls,
}) {
  return lines.map((lineCount, index) => ({
    run_id: `${arm}-task-${index}`,
    task_id: `task-${index}`,
    arm,
    success: true,
    tests_passed: true,
    requirements_met: true,
    files_changed: 2,
    lines_added: lineCount,
    lines_deleted: 0,
    dependencies_added: [],
    tool_calls: toolCalls[index],
    elapsed_ms: 1000,
    scope_violations: [],
    overengineering_findings: [],
    human_rework_minutes: 1,
    reviewer_preferred: reviewerPreferred[index],
  }));
}

function sampleMultiReviewerRuns() {
  return [
    multiReviewerRun("natural-baseline", "task-1", {
      preferences: [
        ["reviewer-a", false],
        ["reviewer-b", false],
      ],
      rework: [7, 8],
    }),
    multiReviewerRun("prompt-control", "task-1", {
      preferences: [
        ["reviewer-a", false],
        ["reviewer-b", false],
      ],
      rework: [5, 6],
    }),
    multiReviewerRun("baldpatch-skill", "task-1", {
      preferences: [
        ["reviewer-a", true],
        ["reviewer-b", true],
      ],
      rework: [2, 3],
    }),
    multiReviewerRun("natural-baseline", "task-2", {
      preferences: [
        ["reviewer-a", false],
        ["reviewer-b", false],
      ],
      rework: [7, 7],
    }),
    multiReviewerRun("prompt-control", "task-2", {
      preferences: [
        ["reviewer-a", false],
        ["reviewer-b", true],
      ],
      rework: [4, 5],
    }),
    multiReviewerRun("baldpatch-skill", "task-2", {
      preferences: [
        ["reviewer-a", true],
        ["reviewer-b", false],
      ],
      rework: [4, 6],
      abstractionJudgments: ["underbuilt", "justified"],
    }),
  ];
}

function sampleM4PairwiseRuns() {
  const m4WinsByTask = [3, 2, 2, 2, 2, 1];
  return m4WinsByTask.flatMap((m4Votes, index) => {
    const taskId = `task-00${index + 1}`;
    return [
      pairwiseRun("m3-baldpatch-skill-rerun", taskId, {
        preferredVotes: 3 - m4Votes,
        lines: 24,
        toolCalls: 10,
        rework: 4,
      }),
      pairwiseRun("m4-reviewer-proof-control", taskId, {
        preferredVotes: m4Votes,
        lines: 20,
        toolCalls: 11,
        rework: 3,
      }),
    ];
  });
}

function sampleM7PairwiseRuns() {
  const targetVotesByTask = {
    "m5-task-001": 3,
    "m5-task-002": 2,
    "m5-task-003": 2,
    "m5-task-004": 2,
    "m5-task-005": 2,
    "m5-task-007": 0,
    "m5-task-008": 2,
    "m5-task-010": 2,
    "m5-task-011": 0,
    "m5-task-012": 3,
  };
  return Object.entries(targetVotesByTask).flatMap(([taskId, targetVotes]) => [
    pairwiseRun("old-baldpatch-skill", taskId, {
      preferredVotes: 3 - targetVotes,
      lines: 20,
      toolCalls: 10,
      rework: 4,
    }),
    pairwiseRun("revised-baldpatch-skill", taskId, {
      preferredVotes: targetVotes,
      lines: 18,
      toolCalls: 11,
      rework: 3,
    }),
  ]);
}

function pairwiseRun(arm, taskId, {
  preferredVotes,
  lines,
  toolCalls,
  rework,
}) {
  return {
    run_id: `${arm}-${taskId}`,
    task_id: taskId,
    arm,
    success: true,
    tests_passed: true,
    requirements_met: true,
    files_changed: 2,
    lines_added: lines,
    lines_deleted: 0,
    dependencies_added: [],
    tool_calls: toolCalls,
    elapsed_ms: 1000,
    scope_violations: [],
    overengineering_findings: [],
    reviewer_preferences: [0, 1, 2].map((index) => ({
      reviewer_id: `reviewer-${index + 1}`,
      preferred: index < preferredVotes,
    })),
    reviewer_assessments: [0, 1, 2].map((index) => ({
      reviewer_id: `reviewer-${index + 1}`,
      expected_rework_minutes: rework,
      abstraction_judgment: "justified",
      underbuild_risk: "low",
    })),
  };
}

function multiReviewerRun(arm, taskId, {
  preferences,
  rework,
  abstractionJudgments = [],
}) {
  return {
    run_id: `${arm}-${taskId}`,
    task_id: taskId,
    arm,
    success: true,
    tests_passed: true,
    requirements_met: true,
    files_changed: 2,
    lines_added: 10,
    lines_deleted: 0,
    dependencies_added: [],
    tool_calls: 5,
    elapsed_ms: 1000,
    scope_violations: [],
    overengineering_findings: [],
    reviewer_preferences: preferences.map(([reviewerId, preferred]) => ({
      reviewer_id: reviewerId,
      preferred,
    })),
    reviewer_assessments: rework.map((minutes, index) => ({
      reviewer_id: `reviewer-${index}`,
      expected_rework_minutes: minutes,
      abstraction_judgment: abstractionJudgments[index] || "justified",
    })),
  };
}

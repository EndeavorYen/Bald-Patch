import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function summarizeRuns(runs) {
  const blockedRuns = runs.filter((run) => run.blocked === true);
  const scoredRuns = runs.filter((run) => run.blocked !== true);
  const arms = [...new Set(scoredRuns.map((run) => run.arm))].sort();
  const armSummaries = arms.map((arm) => summarizeArm(arm, scoredRuns));
  const hardGateFailures = scoredRuns
    .map(hardGateFailure)
    .filter(Boolean);

  return {
    acceptance_checks: acceptanceChecks(armSummaries, scoredRuns),
    arms: armSummaries,
    blocked_runs: blockedRuns.map(blockedRunSummary),
    hard_gate_failures: hardGateFailures,
    reviewer_agreement: reviewerAgreement(scoredRuns),
    regression_warnings: regressionWarnings(armSummaries),
  };
}

export function renderMarkdownReport(summary, {
  title = "Bald Patch Eval Report",
} = {}) {
  const lines = [
    `# ${title}`,
    "",
    "## Summary",
    "",
  ];

  if (summary.arms.length === 0) {
    lines.push("- No scored runs.");
  } else {
    lines.push(
      "| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |",
      "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    );

    for (const arm of summary.arms) {
      lines.push(
        `| ${arm.arm} | ${arm.success_count}/${arm.runs} | ${formatNumber(arm.median_files)} | ${formatNumber(arm.median_loc)} | ${arm.dependency_additions} | ${formatNumber(arm.median_tool_calls)} | ${formatNumber(arm.median_elapsed_ms)} | ${arm.scope_warnings} | ${formatPercent(arm.reviewer_preference_rate)} | ${formatNumber(arm.median_human_rework_minutes)} | ${arm.underbuild_findings} |`,
      );
    }
  }

  lines.push("", "## Reviewer Agreement", "");

  if (summary.reviewer_agreement.tasks === 0) {
    lines.push("- Not available");
  } else {
    lines.push(`- Average agreement: ${formatPercent(summary.reviewer_agreement.average_agreement_rate)}`);
    lines.push(`- Unanimous tasks: ${summary.reviewer_agreement.unanimous_tasks}/${summary.reviewer_agreement.tasks}`);
    lines.push("");
    lines.push("| Task | Reviewer votes | Winning arm | Agreement |");
    lines.push("| --- | ---: | --- | ---: |");
    for (const task of summary.reviewer_agreement.by_task) {
      lines.push(
        `| ${task.task_id} | ${task.reviewer_votes} | ${task.winning_arm} | ${formatPercent(task.agreement_rate)} |`,
      );
    }
  }

  lines.push("", "## Acceptance Check", "");

  if (summary.acceptance_checks.length === 0) {
    lines.push("- Not available");
  } else {
    lines.push("| Gate | Status | Detail |");
    lines.push("| --- | --- | --- |");
    for (const check of summary.acceptance_checks) {
      lines.push(`| ${check.gate} | ${check.status} | ${check.detail} |`);
    }
  }

  lines.push("", "## Acceptance Gate Failures", "");

  const failedAcceptanceChecks = summary.acceptance_checks.filter((check) => {
    return check.status === "fail";
  });
  if (failedAcceptanceChecks.length === 0) {
    lines.push("- None");
  } else {
    lines.push("| Gate | Detail |");
    lines.push("| --- | --- |");
    for (const check of failedAcceptanceChecks) {
      lines.push(`| ${check.gate} | ${check.detail} |`);
    }
  }

  lines.push("", "## Hard Gate Failures", "");

  if (summary.hard_gate_failures.length === 0) {
    lines.push("- None");
  } else {
    lines.push("| Run | Arm | Task | Gates |");
    lines.push("| --- | --- | --- | --- |");
    for (const failure of summary.hard_gate_failures) {
      lines.push(
        `| ${failure.run_id} | ${failure.arm} | ${failure.task_id} | ${failure.gates.join(", ")} |`,
      );
    }
  }

  lines.push("", "## Blocked Runs", "");

  if (summary.blocked_runs.length === 0) {
    lines.push("- None");
  } else {
    lines.push("| Run | Arm | Task | Reason |");
    lines.push("| --- | --- | --- | --- |");
    for (const blocked of summary.blocked_runs) {
      lines.push(
        `| ${blocked.run_id} | ${blocked.arm} | ${blocked.task_id} | ${blocked.reason} |`,
      );
    }
  }

  lines.push("", "## Regression Warnings", "");

  if (summary.regression_warnings.length === 0) {
    lines.push("- None");
  } else {
    for (const warning of summary.regression_warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function acceptanceChecks(arms, runs) {
  const baseline = arms.find((arm) => arm.arm === "baseline");
  const skill = arms.find((arm) => arm.arm === "skill");
  const m4 = arms.find((arm) => arm.arm === "m4-reviewer-proof-control");
  const m3SkillRerun = arms.find((arm) => arm.arm === "m3-baldpatch-skill-rerun")
    || arms.find((arm) => arm.arm === "baldpatch-skill");

  if (m4 && m3SkillRerun) {
    return m4AcceptanceChecks(m3SkillRerun, m4, runs);
  }

  if (!baseline || !skill) {
    return m2AcceptanceChecks(arms);
  }

  return [
    correctnessCheck(baseline, skill, {
      gate: "correctness_not_worse",
      targetLabel: "skill",
      controlLabel: "baseline",
    }),
    locReductionCheck(baseline, skill, {
      gate: "median_loc_reduction",
      targetLabel: "skill",
      controlLabel: "baseline",
    }),
    dependencyReductionCheck(baseline, skill, {
      gate: "dependency_reduction",
      targetLabel: "skill",
      controlLabel: "baseline",
    }),
    toolCallBudgetCheck(baseline, skill, {
      gate: "tool_call_budget",
      targetLabel: "skill",
      controlLabel: "baseline",
    }),
    reviewerPreferenceCheck(skill, {
      gate: "reviewer_preference",
      targetLabel: "skill",
    }),
  ];
}

function m4AcceptanceChecks(control, target, runs) {
  const pairwise = pairwisePreferenceSummary(runs, {
    controlArm: control.arm,
    targetArm: target.arm,
  });

  return [
    {
      gate: "m4_success_6_of_6",
      status: target.runs === 6 && target.success_count === 6 ? "pass" : "fail",
      detail: `${target.arm} success ${target.success_count}/${target.runs}`,
    },
    {
      gate: "m4_pairwise_task_wins_vs_m3_skill",
      status: pairwise.target_task_wins >= 4 ? "pass" : "fail",
      detail: `${target.arm} won ${pairwise.target_task_wins}/${pairwise.tasks} tasks vs ${control.arm}`,
    },
    {
      gate: "m4_pairwise_votes_vs_m3_skill",
      status: pairwise.target_votes >= 10 ? "pass" : "fail",
      detail: `${target.arm} received ${pairwise.target_votes}/${pairwise.total_votes} reviewer votes vs ${control.arm}`,
    },
    {
      gate: "m4_no_unanimous_loss_vs_m3_skill",
      status: pairwise.unanimous_target_losses === 0 ? "pass" : "fail",
      detail: `${target.arm} had ${pairwise.unanimous_target_losses} unanimous task losses vs ${control.arm}`,
    },
    {
      gate: "m4_median_loc_not_higher_vs_m3_skill",
      status: isNumber(target.median_loc)
        && isNumber(control.median_loc)
        && target.median_loc <= control.median_loc
        ? "pass"
        : "fail",
      detail: `${target.arm} median LOC ${formatNumber(target.median_loc)} vs ${control.arm} ${formatNumber(control.median_loc)}`,
    },
    toolCallBudgetCheck(control, target, {
      gate: "m4_tool_call_budget_vs_m3_skill",
      targetLabel: target.arm,
      controlLabel: control.arm,
    }),
    humanReworkCheck(control, target, {
      gate: "m4_human_rework_not_worse_vs_m3_skill",
      targetLabel: target.arm,
      controlLabel: control.arm,
    }),
    underbuildRiskCheck(control, target, {
      gate: "m4_underbuild_risk_not_worse_vs_m3_skill",
      targetLabel: target.arm,
      controlLabel: control.arm,
    }),
  ];
}

function m2AcceptanceChecks(arms) {
  const target = arms.find((arm) => arm.arm === "baldpatch-skill");
  if (!target) {
    return [];
  }

  return ["natural-baseline", "prompt-control"].flatMap((controlName) => {
    const control = arms.find((arm) => arm.arm === controlName);
    if (!control) {
      return [];
    }

    return comparisonChecks(control, target, {
      suffix: `_vs_${controlName}`,
      targetLabel: "baldpatch-skill",
      controlLabel: controlName,
    });
  });
}

function comparisonChecks(control, target, {
  suffix,
  targetLabel,
  controlLabel,
}) {
  return [
    correctnessCheck(control, target, {
      gate: `correctness_not_worse${suffix}`,
      targetLabel,
      controlLabel,
    }),
    locReductionCheck(control, target, {
      gate: `median_loc_reduction${suffix}`,
      targetLabel,
      controlLabel,
    }),
    dependencyReductionCheck(control, target, {
      gate: `dependency_reduction${suffix}`,
      targetLabel,
      controlLabel,
    }),
    toolCallBudgetCheck(control, target, {
      gate: `tool_call_budget${suffix}`,
      targetLabel,
      controlLabel,
    }),
    reviewerPreferenceCheck(target, {
      gate: `reviewer_preference${suffix}`,
      targetLabel,
    }),
    humanReworkCheck(control, target, {
      gate: `human_rework_not_worse${suffix}`,
      targetLabel,
      controlLabel,
    }),
    underbuildRiskCheck(control, target, {
      gate: `underbuild_risk${suffix}`,
      targetLabel,
      controlLabel,
    }),
  ];
}

function correctnessCheck(control, target, {
  gate,
  targetLabel,
  controlLabel,
}) {
  const controlRate = control.success_count / control.runs;
  const targetRate = target.success_count / target.runs;
  return {
    gate,
    status: targetRate >= controlRate ? "pass" : "fail",
    detail: `${targetLabel} success ${target.success_count}/${target.runs} vs ${controlLabel} ${control.success_count}/${control.runs}`,
  };
}

function locReductionCheck(control, target, {
  gate,
  targetLabel,
  controlLabel,
}) {
  const reduction = decreaseRate(control.median_loc, target.median_loc);
  if (!isNumber(reduction)) {
    return {
      gate,
      status: "pending",
      detail: "median LOC unavailable",
    };
  }

  return {
    gate,
    status: reduction >= 0.2 ? "pass" : "fail",
    detail: `${targetLabel} median LOC ${formatNumber(target.median_loc)} vs ${controlLabel} ${formatNumber(control.median_loc)} (${formatDecreaseDeltaPercent(reduction)})`,
  };
}

function dependencyReductionCheck(control, target, {
  gate,
  targetLabel,
  controlLabel,
}) {
  const reduction = decreaseRate(
    control.dependency_additions,
    target.dependency_additions,
  );
  if (!isNumber(reduction)) {
    return {
      gate,
      status: "not-applicable",
      detail: `${controlLabel} had no dependency additions`,
    };
  }

  return {
    gate,
    status: reduction >= 0.5 ? "pass" : "fail",
    detail: `${targetLabel} dependency additions ${target.dependency_additions} vs ${controlLabel} ${control.dependency_additions} (${formatDecreaseDeltaPercent(reduction)})`,
  };
}

function toolCallBudgetCheck(control, target, {
  gate,
  targetLabel,
  controlLabel,
}) {
  const increase = increaseRate(control.median_tool_calls, target.median_tool_calls);
  if (!isNumber(increase)) {
    return {
      gate,
      status: "pending",
      detail: "median tool calls unavailable",
    };
  }

  return {
    gate,
    status: increase <= 0.15 ? "pass" : "fail",
    detail: `${targetLabel} median tool calls ${formatNumber(target.median_tool_calls)} vs ${controlLabel} ${formatNumber(control.median_tool_calls)} (${formatDeltaPercent(increase)})`,
  };
}

function reviewerPreferenceCheck(target, {
  gate,
  targetLabel,
}) {
  if (!isNumber(target.reviewer_preference_rate)) {
    return {
      gate,
      status: "pending",
      detail: "blind reviewer preference unavailable",
    };
  }

  return {
    gate,
    status: target.reviewer_preference_rate >= 0.6 ? "pass" : "fail",
    detail: `${targetLabel} reviewer preference ${formatPercent(target.reviewer_preference_rate)} (threshold 60%)`,
  };
}

function humanReworkCheck(control, target, {
  gate,
  targetLabel,
  controlLabel,
}) {
  if (!isNumber(control.median_human_rework_minutes) || !isNumber(target.median_human_rework_minutes)) {
    return {
      gate,
      status: "pending",
      detail: "reviewer rework minutes unavailable",
    };
  }

  return {
    gate,
    status: target.median_human_rework_minutes <= control.median_human_rework_minutes ? "pass" : "fail",
    detail: `${targetLabel} median rework ${formatNumber(target.median_human_rework_minutes)} min vs ${controlLabel} ${formatNumber(control.median_human_rework_minutes)} min`,
  };
}

function underbuildRiskCheck(control, target, {
  gate,
  targetLabel,
  controlLabel,
}) {
  return {
    gate,
    status: target.underbuild_findings <= control.underbuild_findings ? "pass" : "fail",
    detail: `${targetLabel} underbuild findings ${target.underbuild_findings} vs ${controlLabel} ${control.underbuild_findings}`,
  };
}

function blockedRunSummary(run) {
  return {
    run_id: run.run_id,
    arm: run.arm,
    task_id: run.task_id,
    reason: run.block_reason || "blocked",
  };
}

function summarizeArm(arm, runs) {
  const armRuns = runs.filter((run) => run.arm === arm);
  const reviewerValues = armRuns.flatMap(reviewerPreferenceValues);

  return {
    arm,
    runs: armRuns.length,
    success_count: armRuns.filter((run) => run.success === true).length,
    median_files: median(armRuns.map((run) => run.files_changed)),
    median_loc: median(
      armRuns.map((run) => numeric(run.lines_added) + numeric(run.lines_deleted)),
    ),
    dependency_additions: armRuns.filter((run) => {
      return Array.isArray(run.dependencies_added)
        && run.dependencies_added.length > 0;
    }).length,
    median_tool_calls: median(armRuns.map((run) => run.tool_calls)),
    median_elapsed_ms: median(armRuns.map((run) => run.elapsed_ms)),
    scope_warnings: armRuns.reduce((total, run) => {
      return total
        + arrayLength(run.scope_violations)
        + arrayLength(run.overengineering_findings);
    }, 0),
    reviewer_preference_rate: reviewerValues.length === 0
      ? null
      : reviewerValues.filter(Boolean).length / reviewerValues.length,
    median_human_rework_minutes: median(armRuns.flatMap(humanReworkValues)),
    underbuild_findings: armRuns.reduce((total, run) => total + underbuildFindings(run), 0),
  };
}

function reviewerPreferenceValues(run) {
  if (Array.isArray(run.reviewer_preferences)) {
    return run.reviewer_preferences
      .map((preference) => preference.preferred)
      .filter((value) => typeof value === "boolean");
  }
  return typeof run.reviewer_preferred === "boolean" ? [run.reviewer_preferred] : [];
}

function humanReworkValues(run) {
  if (Array.isArray(run.reviewer_assessments)) {
    const values = run.reviewer_assessments
      .map((assessment) => assessment.expected_rework_minutes)
      .filter(isNumber);
    if (values.length > 0) {
      return values;
    }
  }
  return isNumber(run.human_rework_minutes) ? [run.human_rework_minutes] : [];
}

function underbuildFindings(run) {
  if (!Array.isArray(run.reviewer_assessments)) {
    return 0;
  }
  return run.reviewer_assessments.filter((assessment) => {
    return assessment.abstraction_judgment === "underbuilt"
      || ["medium", "high"].includes(assessment.underbuild_risk);
  }).length;
}

function pairwisePreferenceSummary(runs, {
  controlArm,
  targetArm,
}) {
  const byTask = new Map();

  for (const run of runs) {
    if (run.arm !== controlArm && run.arm !== targetArm) {
      continue;
    }
    const task = byTask.get(run.task_id) || {
      control_votes: 0,
      target_votes: 0,
      total_votes: 0,
    };
    for (const preference of Array.isArray(run.reviewer_preferences) ? run.reviewer_preferences : []) {
      if (preference.preferred !== true) {
        continue;
      }
      task.total_votes += 1;
      if (run.arm === targetArm) {
        task.target_votes += 1;
      } else {
        task.control_votes += 1;
      }
    }
    byTask.set(run.task_id, task);
  }

  const tasks = [...byTask.values()];
  return {
    tasks: tasks.length,
    target_task_wins: tasks.filter((task) => task.target_votes > task.control_votes).length,
    target_votes: tasks.reduce((total, task) => total + task.target_votes, 0),
    total_votes: tasks.reduce((total, task) => total + task.total_votes, 0),
    unanimous_target_losses: tasks.filter((task) => {
      return task.total_votes >= 3 && task.target_votes === 0;
    }).length,
  };
}

function reviewerAgreement(runs) {
  const choicesByTask = new Map();

  for (const run of runs) {
    for (const preference of Array.isArray(run.reviewer_preferences) ? run.reviewer_preferences : []) {
      if (preference.preferred !== true) {
        continue;
      }
      if (!choicesByTask.has(run.task_id)) {
        choicesByTask.set(run.task_id, new Map());
      }
      choicesByTask.get(run.task_id).set(preference.reviewer_id, run.arm);
    }
  }

  const byTask = [...choicesByTask.entries()]
    .map(([taskId, reviewerChoices]) => {
      const counts = new Map();
      for (const arm of reviewerChoices.values()) {
        counts.set(arm, (counts.get(arm) || 0) + 1);
      }
      const [winningArm, winningCount] = [...counts.entries()]
        .sort(([leftArm, leftCount], [rightArm, rightCount]) => {
          return rightCount - leftCount || leftArm.localeCompare(rightArm);
        })[0];
      const reviewerVotes = reviewerChoices.size;
      return {
        task_id: taskId,
        reviewer_votes: reviewerVotes,
        winning_arm: winningArm,
        agreement_rate: round(winningCount / reviewerVotes),
      };
    })
    .sort((left, right) => left.task_id.localeCompare(right.task_id));

  return {
    tasks: byTask.length,
    unanimous_tasks: byTask.filter((task) => task.agreement_rate === 1).length,
    average_agreement_rate: byTask.length === 0
      ? null
      : round(byTask.reduce((total, task) => total + task.agreement_rate, 0) / byTask.length),
    by_task: byTask,
  };
}

function hardGateFailure(run) {
  const gates = [];

  if (run.success !== true) {
    gates.push("success");
  }
  if (run.tests_passed !== true) {
    gates.push("tests_passed");
  }
  if (run.requirements_met !== true) {
    gates.push("requirements_met");
  }
  if (run.safety_removed === true) {
    gates.push("safety");
  }
  if (run.avoidable_dependency_added === true) {
    gates.push("dependency");
  }
  if (run.broad_unrelated_rewrite === true) {
    gates.push("scope");
  }
  if (run.reviewability_failed === true) {
    gates.push("reviewability");
  }

  if (gates.length === 0) {
    return null;
  }

  return {
    run_id: run.run_id,
    arm: run.arm,
    task_id: run.task_id,
    gates,
  };
}

function regressionWarnings(arms) {
  const baseline = arms.find((arm) => arm.arm === "baseline");
  if (!baseline) {
    return [];
  }

  return arms
    .filter((arm) => arm.arm !== "baseline")
    .flatMap((arm) => {
      const warnings = [];
      if (
        isNumber(arm.median_loc)
        && isNumber(baseline.median_loc)
        && isNumber(arm.median_human_rework_minutes)
        && isNumber(baseline.median_human_rework_minutes)
        && arm.median_loc < baseline.median_loc
        && arm.median_human_rework_minutes > baseline.median_human_rework_minutes
      ) {
        warnings.push(
          `${arm.arm} has smaller median LOC than baseline but higher human rework.`,
        );
      }

      return warnings;
    });
}

function median(values) {
  const numbers = values
    .map(numericOrNull)
    .filter(isNumber)
    .sort((left, right) => left - right);

  if (numbers.length === 0) {
    return null;
  }

  const middle = Math.floor(numbers.length / 2);
  if (numbers.length % 2 === 1) {
    return numbers[middle];
  }

  return round((numbers[middle - 1] + numbers[middle]) / 2);
}

function numeric(value) {
  return numericOrNull(value) ?? 0;
}

function numericOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

function decreaseRate(before, after) {
  if (!isNumber(before) || !isNumber(after) || before <= 0) {
    return null;
  }
  return round((before - after) / before);
}

function increaseRate(before, after) {
  if (!isNumber(before) || !isNumber(after) || before <= 0) {
    return null;
  }
  return round((after - before) / before);
}

function round(value) {
  return Number(value.toFixed(2));
}

function formatNumber(value) {
  return isNumber(value) ? String(value) : "-";
}

function formatPercent(value) {
  return isNumber(value) ? `${Math.round(value * 100)}%` : "-";
}

function formatDeltaPercent(value) {
  if (!isNumber(value)) {
    return "-";
  }
  if (value === 0) {
    return "unchanged";
  }

  const direction = value > 0 ? "higher" : "lower";
  return `${Math.abs(Math.round(value * 100))}% ${direction}`;
}

function formatDecreaseDeltaPercent(value) {
  if (!isNumber(value)) {
    return "-";
  }
  if (value === 0) {
    return "unchanged";
  }

  const direction = value > 0 ? "lower" : "higher";
  return `${Math.abs(Math.round(value * 100))}% ${direction}`;
}

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    title: "Bald Patch Eval Report",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      args.input = argv[index + 1];
      index += 1;
    } else if (arg === "--output") {
      args.output = argv[index + 1];
      index += 1;
    } else if (arg === "--title") {
      args.title = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input
    ? readFileSync(args.input, "utf8")
    : readFileSync(0, "utf8");
  const report = renderMarkdownReport(summarizeRuns(parseJsonl(input)), {
    title: args.title,
  });

  if (args.output) {
    writeFileSync(args.output, report);
  } else {
    process.stdout.write(report);
  }
}

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
    acceptance_checks: acceptanceChecks(armSummaries),
    arms: armSummaries,
    blocked_runs: blockedRuns.map(blockedRunSummary),
    hard_gate_failures: hardGateFailures,
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
      "| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference |",
      "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    );

    for (const arm of summary.arms) {
      lines.push(
        `| ${arm.arm} | ${arm.success_count}/${arm.runs} | ${formatNumber(arm.median_files)} | ${formatNumber(arm.median_loc)} | ${arm.dependency_additions} | ${formatNumber(arm.median_tool_calls)} | ${formatNumber(arm.median_elapsed_ms)} | ${arm.scope_warnings} | ${formatPercent(arm.reviewer_preference_rate)} |`,
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

function acceptanceChecks(arms) {
  const baseline = arms.find((arm) => arm.arm === "baseline");
  const skill = arms.find((arm) => arm.arm === "skill");

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
    detail: `${targetLabel} median LOC ${formatNumber(target.median_loc)} vs ${controlLabel} ${formatNumber(control.median_loc)} (${formatPercent(reduction)} lower)`,
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
    detail: `${targetLabel} dependency additions ${target.dependency_additions} vs ${controlLabel} ${control.dependency_additions} (${formatPercent(reduction)} lower)`,
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
    detail: `${targetLabel} median tool calls ${formatNumber(target.median_tool_calls)} vs ${controlLabel} ${formatNumber(control.median_tool_calls)} (${formatPercent(increase)} higher)`,
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
  const reviewerValues = armRuns
    .map((run) => run.reviewer_preferred)
    .filter((value) => typeof value === "boolean");

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
    median_human_rework_minutes: median(
      armRuns.map((run) => run.human_rework_minutes),
    ),
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

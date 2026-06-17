import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { parseJsonl } from "./score-run.mjs";

export function summarizePairs(runs) {
  const scored = runs.filter((run) => run.blocked !== true);
  const tasks = [...new Set(scored.map((run) => run.task_id))].sort();
  const pairs = tasks
    .map((taskId) => pairedTask(taskId, scored))
    .filter(Boolean);

  return {
    overview: {
      tasks: pairs.length,
      success_regressions: pairs.filter((pair) => pair.success_status === "regressed").length,
      loc_smaller: pairs.filter((pair) => pair.loc_delta < 0).length,
      loc_equal: pairs.filter((pair) => pair.loc_delta === 0).length,
      loc_larger: pairs.filter((pair) => pair.loc_delta > 0).length,
      tool_calls_lower: pairs.filter((pair) => pair.tool_call_delta < 0).length,
      tool_calls_equal: pairs.filter((pair) => pair.tool_call_delta === 0).length,
      tool_calls_higher: pairs.filter((pair) => pair.tool_call_delta > 0).length,
      elapsed_faster: pairs.filter((pair) => pair.elapsed_delta_ms < 0).length,
      elapsed_slower: pairs.filter((pair) => pair.elapsed_delta_ms > 0).length,
      dependency_signal_tasks: pairs.filter((pair) => pair.dependency_delta !== 0).length,
      scope_warning_tasks: pairs.filter((pair) => pair.scope_warning_delta !== 0).length,
    },
    pairs,
  };
}

export function renderMarkdownAnalysis(analysis, {
  title = "Bald Patch M1 Evidence Analysis",
} = {}) {
  const { overview, pairs } = analysis;
  const lines = [
    `# ${title}`,
    "",
    "## Evidence Summary",
    "",
    `- Skill produced smaller LOC on ${overview.loc_smaller}/${overview.tasks} tasks, equal LOC on ${overview.loc_equal}/${overview.tasks}, and larger LOC on ${overview.loc_larger}/${overview.tasks}.`,
    `- Skill used fewer tool calls on ${overview.tool_calls_lower}/${overview.tasks} tasks.`,
    `- Skill used more tool calls on ${overview.tool_calls_higher}/${overview.tasks} tasks; ${overview.tool_calls_equal}/${overview.tasks} tasks were equal.`,
    `- Skill was faster on ${overview.elapsed_faster}/${overview.tasks} tasks and slower on ${overview.elapsed_slower}/${overview.tasks} tasks.`,
    `- Success regressions: ${overview.success_regressions}.`,
    "",
    "## Per-Task Deltas",
    "",
    "| Task | Success | LOC delta | Tool-call delta | Elapsed delta ms | Dependency delta | Scope-warning delta |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const pair of pairs) {
    lines.push(
      `| ${pair.task_id} | ${pair.success_status} | ${signed(pair.loc_delta)} | ${signed(pair.tool_call_delta)} | ${signed(pair.elapsed_delta_ms)} | ${signed(pair.dependency_delta)} | ${signed(pair.scope_warning_delta)} |`,
    );
  }

  lines.push("", "## Evidence Gaps", "");
  if (overview.dependency_signal_tasks === 0) {
    lines.push("- The eval has weak dependency/scope signal: no paired task changed dependency additions or scope warnings.");
  }
  lines.push("- Blind reviewer preference is still required before deciding whether smaller or equal diffs are actually easier to review.");

  lines.push("", "## Next-Phase Implications", "");
  lines.push("- Treat M1 as a calibration run, not proof that Bald Patch works.");
  lines.push("- Keep the current runner/scorer, but make M2 tasks harder at tempting avoidable dependencies, speculative abstractions, and broad rewrites.");
  lines.push("- Collect blind review answers for this M1 packet before changing the skill text, so the next change is based on reviewer value rather than LOC alone.");

  lines.push("", "## Recommended Decision", "");
  lines.push("- Do not expand Bald Patch beyond the current docs-first skill from M1 alone.");
  lines.push("- Use the M1 blind review to decide whether the small objective LOC delta still has reviewer value.");
  lines.push("- Start M2 only after the blind review is decoded, with harder trap tasks and at least one control arm that can expose overbuild more clearly.");

  lines.push("");
  return lines.join("\n");
}

function pairedTask(taskId, runs) {
  const baseline = runs.find((run) => run.task_id === taskId && run.arm === "baseline");
  const skill = runs.find((run) => run.task_id === taskId && run.arm === "skill");
  if (!baseline || !skill) {
    return null;
  }

  return {
    task_id: taskId,
    success_status: successStatus(baseline, skill),
    loc_delta: loc(skill) - loc(baseline),
    tool_call_delta: numeric(skill.tool_calls) - numeric(baseline.tool_calls),
    elapsed_delta_ms: numeric(skill.elapsed_ms) - numeric(baseline.elapsed_ms),
    dependency_delta: arrayLength(skill.dependencies_added)
      - arrayLength(baseline.dependencies_added),
    scope_warning_delta: warnings(skill) - warnings(baseline),
  };
}

function successStatus(baseline, skill) {
  if (skill.success === baseline.success) {
    return skill.success === true ? "pass" : "same-failure";
  }
  return skill.success === true ? "recovered" : "regressed";
}

function loc(run) {
  return numeric(run.lines_added) + numeric(run.lines_deleted);
}

function warnings(run) {
  return arrayLength(run.scope_violations) + arrayLength(run.overengineering_findings);
}

function numeric(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

function signed(value) {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    title: "Bald Patch M1 Evidence Analysis",
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
  const report = renderMarkdownAnalysis(summarizePairs(parseJsonl(input)), {
    title: args.title,
  });

  if (args.output) {
    writeFileSync(args.output, report);
  } else {
    process.stdout.write(report);
  }
}

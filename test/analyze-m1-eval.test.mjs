import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  renderMarkdownAnalysis,
  summarizePairs,
} from "../scripts/analyze-m1-eval.mjs";

describe("analyze-m1-eval", () => {
  it("compares baseline and skill rows by task", () => {
    const analysis = summarizePairs(sampleRuns());

    assert.deepEqual(analysis.overview, {
      tasks: 3,
      success_regressions: 0,
      loc_smaller: 1,
      loc_equal: 1,
      loc_larger: 1,
      tool_calls_lower: 1,
      tool_calls_equal: 1,
      tool_calls_higher: 1,
      elapsed_faster: 1,
      elapsed_slower: 2,
      dependency_signal_tasks: 0,
      scope_warning_tasks: 0,
    });
    assert.deepEqual(analysis.pairs.map((pair) => ({
      task_id: pair.task_id,
      loc_delta: pair.loc_delta,
      tool_call_delta: pair.tool_call_delta,
      elapsed_delta_ms: pair.elapsed_delta_ms,
    })), [
      {
        task_id: "cli-json-flag",
        loc_delta: -11,
        tool_call_delta: -7,
        elapsed_delta_ms: -50000,
      },
      {
        task_id: "native-date-picker",
        loc_delta: 1,
        tool_call_delta: 6,
        elapsed_delta_ms: 40000,
      },
      {
        task_id: "single-provider-no-plugin-architecture",
        loc_delta: 0,
        tool_call_delta: 0,
        elapsed_delta_ms: 10000,
      },
    ]);
  });

  it("renders a next-phase evidence report", () => {
    const markdown = renderMarkdownAnalysis(summarizePairs(sampleRuns()), {
      title: "M1 Analysis",
    });

    assert.match(markdown, /# M1 Analysis/);
    assert.match(markdown, /Skill produced smaller LOC on 1\/3 tasks/);
    assert.match(markdown, /Skill used more tool calls on 1\/3 tasks/);
    assert.match(markdown, /The eval has weak dependency\/scope signal/);
    assert.match(markdown, /Do not expand Bald Patch beyond the current docs-first skill from M1 alone/);
    assert.match(markdown, /\| native-date-picker \| pass \| \+1 \| \+6 \| \+40000 \|/);
  });
});

function sampleRuns() {
  return [
    {
      task_id: "cli-json-flag",
      arm: "baseline",
      success: true,
      lines_added: 31,
      lines_deleted: 1,
      tool_calls: 25,
      elapsed_ms: 170000,
      dependencies_added: [],
      scope_violations: [],
      overengineering_findings: [],
    },
    {
      task_id: "cli-json-flag",
      arm: "skill",
      success: true,
      lines_added: 20,
      lines_deleted: 1,
      tool_calls: 18,
      elapsed_ms: 120000,
      dependencies_added: [],
      scope_violations: [],
      overengineering_findings: [],
    },
    {
      task_id: "native-date-picker",
      arm: "baseline",
      success: true,
      lines_added: 17,
      lines_deleted: 0,
      tool_calls: 17,
      elapsed_ms: 120000,
      dependencies_added: [],
      scope_violations: [],
      overengineering_findings: [],
    },
    {
      task_id: "native-date-picker",
      arm: "skill",
      success: true,
      lines_added: 18,
      lines_deleted: 0,
      tool_calls: 23,
      elapsed_ms: 160000,
      dependencies_added: [],
      scope_violations: [],
      overengineering_findings: [],
    },
    {
      task_id: "single-provider-no-plugin-architecture",
      arm: "baseline",
      success: true,
      lines_added: 20,
      lines_deleted: 6,
      tool_calls: 23,
      elapsed_ms: 140000,
      dependencies_added: [],
      scope_violations: [],
      overengineering_findings: [],
    },
    {
      task_id: "single-provider-no-plugin-architecture",
      arm: "skill",
      success: true,
      lines_added: 20,
      lines_deleted: 6,
      tool_calls: 23,
      elapsed_ms: 150000,
      dependencies_added: [],
      scope_violations: [],
      overengineering_findings: [],
    },
  ];
}

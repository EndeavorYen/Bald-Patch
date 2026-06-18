import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";

import { readTasks } from "../scripts/fixture-utils.mjs";
import { buildRunPlan } from "../scripts/run-ab.mjs";

const TASK_ROOT = path.join(process.cwd(), "evals", "tasks");

describe("M1 eval tasks", () => {
  it("defines 10 smoke tasks across real and trap categories", () => {
    const tasks = readTasks(TASK_ROOT);

    assert.equal(tasks.length, 10);
    assert.equal(tasks.filter((task) => task.kind === "real").length, 4);
    assert.equal(tasks.filter((task) => task.kind === "trap").length, 6);

    for (const task of tasks) {
      assert.match(task.id, /^[a-z0-9-]+$/);
      assert.match(task.public_id, /^task-\d{3}$/);
      assert.equal(typeof task.title, "string");
      assert.equal(typeof task.prompt, "string");
      assert.ok(task.prompt.length > 20);
      assert.ok(Array.isArray(task.success_criteria));
      assert.ok(task.success_criteria.length >= 2);
      assert.ok(Array.isArray(task.overbuild_risks));
      assert.ok(task.overbuild_risks.length >= 1);
      assert.equal(typeof task.fixture?.project, "string");
      assert.equal(typeof task.fixture?.acceptance, "string");
      assert.equal(typeof task.fixture?.verify, "string");
      assert.match(task.fixture.verify, new RegExp(`--task ${task.id}\\b`));
    }
  });

  it("provides clean M2 natural-baseline prompt text", () => {
    const naturalRuns = buildRunPlan(readTasks(TASK_ROOT, { mode: "m2" }), { mode: "m2" })
      .filter((run) => run.arm === "natural-baseline");

    assert.equal(naturalRuns.length, 11);
    for (const run of naturalRuns) {
      assert.match(run.task_id, /^task-\d{3}$/);
      assert.doesNotMatch(run.task_id, /lodash|plugin|rewrite|library|provider/i);
      assert.doesNotMatch(run.prompt, /Success criteria:/);
      assert.doesNotMatch(run.prompt, /Overbuild risks to watch:/);
      assert.doesNotMatch(
        run.prompt,
        /without|dependency|framework|plugin|rewrite|smallest|prefer native/i,
      );
    }
  });

  it("adds M2-only positive-control tasks without changing the M1 task set", () => {
    const m1Tasks = readTasks(TASK_ROOT);
    const m2Tasks = readTasks(TASK_ROOT, { mode: "m2" });

    assert.equal(m1Tasks.length, 10);
    assert.equal(m2Tasks.length, 11);
    assert.equal(m2Tasks.filter((task) => task.kind === "positive-control").length, 1);

    const m2Plan = buildRunPlan(m2Tasks, { mode: "m2" });
    assert.equal(m2Plan.length, 33);
    assert.deepEqual(
      m2Plan
        .filter((run) => run.fixture_task_id === "shared-format-helper")
        .map((run) => run.arm),
      ["natural-baseline", "prompt-control", "baldpatch-skill"],
    );
  });

  it("uses the M2 task corpus for M4 reviewer-proof canaries", () => {
    const m4Tasks = readTasks(TASK_ROOT, { mode: "m4" });
    const m4Plan = buildRunPlan(m4Tasks, { mode: "m4" });

    assert.equal(m4Tasks.length, 11);
    assert.equal(m4Plan.length, 11);
    assert.deepEqual(
      m4Plan
        .filter((run) => run.fixture_task_id === "shared-format-helper")
        .map((run) => run.arm),
      ["m4-reviewer-proof-control"],
    );
  });

  it("defines a curated M5 suite with at least half holdout tasks", () => {
    const m5Tasks = readTasks(TASK_ROOT, { mode: "m5" });
    const m5Plan = buildRunPlan(m5Tasks, { mode: "m5" });

    assert.equal(m5Tasks.length, 12);
    assert.equal(m5Tasks.filter((task) => task.kind === "m5-known-failure").length, 6);
    assert.equal(m5Tasks.filter((task) => task.kind === "m5-holdout").length, 6);
    assert.equal(m5Plan.length, 48);
    assert.deepEqual([...new Set(m5Plan.map((run) => run.arm))], [
      "natural-baseline",
      "prompt-control",
      "old-baldpatch-skill",
      "provisional-baldpatch-skill",
    ]);

    for (const task of m5Tasks) {
      assert.match(task.public_id, /^m5-task-\d{3}$/);
      assert.equal(typeof task.m5_rule_area, "string");
      assert.equal(typeof task.m5_case, "string");
      assert.match(task.fixture.verify, new RegExp(`--task ${task.id}\\b`));
    }
  });
});

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { buildRunPlan } from "../scripts/run-ab.mjs";

const TASK_ROOT = path.join(process.cwd(), "evals", "tasks");

describe("M1 eval tasks", () => {
  it("defines 10 smoke tasks across real and trap categories", () => {
    const tasks = readTasks();

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
    const naturalRuns = buildRunPlan(readTasks(), { mode: "m2" })
      .filter((run) => run.arm === "natural-baseline");

    assert.equal(naturalRuns.length, 10);
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
});

function readTasks() {
  return ["real", "traps"].flatMap((kind) => {
    const dir = path.join(TASK_ROOT, kind);
    return readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf8")));
  });
}

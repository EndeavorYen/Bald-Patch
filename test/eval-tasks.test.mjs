import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const TASK_ROOT = path.join(process.cwd(), "evals", "tasks");

describe("M1 eval tasks", () => {
  it("defines 10 smoke tasks across real and trap categories", () => {
    const tasks = readTasks();

    assert.equal(tasks.length, 10);
    assert.equal(tasks.filter((task) => task.kind === "real").length, 4);
    assert.equal(tasks.filter((task) => task.kind === "trap").length, 6);

    for (const task of tasks) {
      assert.match(task.id, /^[a-z0-9-]+$/);
      assert.equal(typeof task.title, "string");
      assert.equal(typeof task.prompt, "string");
      assert.ok(task.prompt.length > 20);
      assert.ok(Array.isArray(task.success_criteria));
      assert.ok(task.success_criteria.length >= 2);
      assert.ok(Array.isArray(task.overbuild_risks));
      assert.ok(task.overbuild_risks.length >= 1);
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

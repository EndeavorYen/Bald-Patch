import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  loadTasks,
  buildPrompt,
  buildRunPlan,
} from "../scripts/run-ab.mjs";

describe("run-ab", () => {
  it("loads M2-only positive-control tasks for M2 plans", () => {
    assert.equal(loadTasks("evals/tasks").length, 10);
    assert.equal(loadTasks("evals/tasks", { mode: "m2" }).length, 11);
  });

  it("builds baseline and skill runs for every task", () => {
    const plan = buildRunPlan([
      {
        id: "native-date-picker",
        title: "Add date picker",
        prompt: "Add a due-date field.",
        success_criteria: ["Users can choose a date"],
        overbuild_risks: ["Adding a dependency"],
        fixture: {
          project: "evals/fixtures/native-date-picker/project",
          verify: "node scripts/verify-fixture.mjs --task native-date-picker --cwd <fixture>",
        },
      },
      {
        id: "debounce-without-lodash",
        title: "Debounce search",
        prompt: "Debounce the search input.",
        success_criteria: ["Search fires after pause"],
        overbuild_risks: ["Adding lodash"],
        fixture: {
          project: "evals/fixtures/debounce-without-lodash/project",
          verify: "node scripts/verify-fixture.mjs --task debounce-without-lodash --cwd <fixture>",
        },
      },
    ]);

    assert.deepEqual(
      plan.map((run) => `${run.task_id}:${run.arm}`),
      [
        "native-date-picker:baseline",
        "native-date-picker:skill",
        "debounce-without-lodash:baseline",
        "debounce-without-lodash:skill",
      ],
    );
    assert.equal(plan[0].fixture_project, "evals/fixtures/native-date-picker/project");
    assert.equal(
      plan[0].fixture_verify,
      "node scripts/verify-fixture.mjs --task native-date-picker --cwd <fixture>",
    );
  });

  it("keeps the skill arm explicit and leaves baseline unguided", () => {
    const task = {
      id: "native-date-picker",
      title: "Add date picker",
      prompt: "Add a due-date field.",
      success_criteria: ["Users can choose a date"],
      overbuild_risks: ["Adding a dependency"],
    };

    assert.doesNotMatch(buildPrompt(task, "baseline"), /\$baldpatch-patch/);
    assert.match(buildPrompt(task, "skill"), /^\$baldpatch-patch/);
    assert.match(buildPrompt(task, "skill"), /Users can choose a date/);
    assert.match(buildPrompt(task, "skill"), /Adding a dependency/);
  });

  it("builds M2 natural, prompt-control, and Bald Patch skill arms", () => {
    const task = {
      id: "task-001",
      public_id: "public-task-001",
      title: "Update CLI output",
      neutral_title: "Update CLI output",
      natural_prompt: "Add machine-readable output for the existing command.",
      prompt: "Add a --json flag without changing default output.",
      success_criteria: ["No production dependency is added"],
      overbuild_risks: ["Adding a command framework"],
    };
    const plan = buildRunPlan([task], { mode: "m2" });

    assert.deepEqual(plan.map((run) => run.arm), [
      "natural-baseline",
      "prompt-control",
      "baldpatch-skill",
    ]);
    assert.equal(plan[0].task_id, "public-task-001");
    assert.equal(plan[0].fixture_task_id, "task-001");
    assert.match(plan[0].prompt, /Add machine-readable output/);
    assert.doesNotMatch(plan[0].prompt, /No production dependency/);
    assert.doesNotMatch(plan[0].prompt, /command framework/);
    assert.doesNotMatch(plan[0].prompt, /avoid/i);
    assert.match(plan[1].prompt, /Avoid unnecessary dependencies/);
    assert.doesNotMatch(plan[1].prompt, /command framework/);
    assert.match(plan[2].prompt, /^\$baldpatch-patch/);
    assert.match(plan[2].prompt, /Add machine-readable output/);
    assert.doesNotMatch(plan[2].prompt, /command framework/);
  });

  it("builds the M4 reviewer-proof prompt-only control arm", () => {
    const task = {
      id: "task-011",
      public_id: "public-task-011",
      title: "Share amount formatting",
      neutral_title: "Share amount formatting",
      natural_prompt: "Introduce a shared formatAmount helper and use it from both summaries.",
      prompt: "Introduce a shared helper without changing labels.",
    };
    const plan = buildRunPlan([task], { mode: "m4" });

    assert.deepEqual(plan.map((run) => run.arm), [
      "m4-reviewer-proof-control",
    ]);
    assert.equal(plan[0].task_id, "public-task-011");
    assert.equal(plan[0].fixture_task_id, "task-011");
    assert.match(plan[0].prompt, /Introduce a shared formatAmount helper/);
    assert.match(plan[0].prompt, /Do not add or export a helper solely for a tiny branch/);
    assert.match(plan[0].prompt, /preserve existing wrapper call paths/);
    assert.doesNotMatch(plan[0].prompt, /\$baldpatch-patch/);
  });

  it("builds M5 old and provisional skill prompts from explicit snapshots", () => {
    const task = {
      id: "m5-known-cli-json-flag",
      public_id: "m5-task-001",
      title: "Add a JSON output flag to a CLI",
      neutral_title: "Add a JSON output flag to a CLI",
      natural_prompt: "Add a --json flag to the CLI while keeping default output unchanged.",
      prompt: "Add a --json flag to the CLI while keeping default output unchanged.",
      success_criteria: ["Default output remains unchanged"],
      overbuild_risks: ["Adding a command framework"],
    };
    const plan = buildRunPlan([task], { mode: "m5" });

    assert.deepEqual(plan.map((run) => run.arm), [
      "natural-baseline",
      "prompt-control",
      "old-baldpatch-skill",
      "provisional-baldpatch-skill",
    ]);
    assert.equal(plan[0].task_id, "m5-task-001");
    assert.equal(plan[0].fixture_task_id, "m5-known-cli-json-flag");
    assert.match(plan[2].prompt, /Use this exact old Bald Patch skill guidance/);
    assert.match(plan[2].prompt, /For debounce or timer behavior, prefer deterministic timer tests over real sleeps\./);
    assert.doesNotMatch(plan[2].prompt, /Provisional M4 Constraints/);
    assert.match(plan[3].prompt, /Use this exact provisional Bald Patch skill guidance/);
    assert.match(plan[3].prompt, /Provisional M4 Constraints/);
    assert.match(plan[3].prompt, /Do not replace existing high-signal focused tests/);
  });
});

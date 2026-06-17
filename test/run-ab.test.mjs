import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPrompt,
  buildRunPlan,
} from "../scripts/run-ab.mjs";

describe("run-ab", () => {
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
});

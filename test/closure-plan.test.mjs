import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const CLOSURE_PLAN_PATH = "docs/closure-plan.md";
const README_PATH = "README.md";
const POSTURE_PATH = "docs/posture.md";
const FINAL_REPORT_PATH = "docs/final-report.md";

describe("closure plan", () => {
  it("defines the post-M9 closure target and track gates", () => {
    const plan = readFileSync(CLOSURE_PLAN_PATH, "utf8");

    assert.match(plan, /^# Bald Patch Closure Plan/m);
    assert.match(plan, /anti-overbuild/i);
    assert.match(plan, /eval and review evidence toolkit/i);
    assert.match(plan, /Closure Objective/i);
    assert.match(plan, /Definition Of Done/i);
    assert.match(plan, /v0\.1-evidence-freeze/i);

    for (const track of ["E1: Eval Discrimination", "E2: Realistic Task Suite", "E3: Review Evidence Productization"]) {
      assert.match(plan, new RegExp(track));
    }

    for (const issue of ["issues/59", "issues/60", "issues/61"]) {
      assert.match(plan, new RegExp(issue));
    }

    assert.match(plan, /minimum discrimination gate/i);
    assert.match(plan, /complete three-reviewer/i);
    assert.match(plan, /blind review/i);
    assert.match(plan, /No new external eval round before E1\/E2\/E3/i);
    assert.match(plan, /No live `\$baldpatch-patch` wording change/i);
  });

  it("links the closure plan from the main reader surfaces", () => {
    const readme = readFileSync(README_PATH, "utf8");
    const posture = readFileSync(POSTURE_PATH, "utf8");
    const finalReport = readFileSync(FINAL_REPORT_PATH, "utf8");

    assert.match(readme, /docs\/closure-plan\.md/);
    assert.match(posture, /closure-plan\.md/);
    assert.match(finalReport, /closure-plan\.md/);
  });
});

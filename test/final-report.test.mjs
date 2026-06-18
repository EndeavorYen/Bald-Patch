import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const FINAL_REPORT_PATH = "docs/final-report.md";

describe("final project report", () => {
  it("summarizes M1 through M9 and the post-M9 closure decision", () => {
    const report = readFileSync(FINAL_REPORT_PATH, "utf8");

    assert.match(report, /^# Bald Patch Final Report/m);
    assert.match(report, /anti-overbuild eval and review evidence toolkit/i);

    for (const milestone of ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9"]) {
      assert.match(report, new RegExp(`\\| ${milestone} \\|`));
    }

    assert.match(report, /Positive Evidence/i);
    assert.match(report, /Negative Evidence/i);
    assert.match(report, /Noisy Or Inconclusive Evidence/i);
    assert.match(report, /Why The Live Skill Stays Frozen/i);
    assert.match(report, /Why Hooks And Plugins Stay Out Of Scope/i);
    assert.match(report, /Reusable Assets/i);
    assert.match(report, /Restart Criteria/i);
    assert.match(report, /E1/i);
    assert.match(report, /E2/i);
    assert.match(report, /E3/i);
  });
});

import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("m5 safe report name acceptance", () => {
  it("accepts simple names and rejects path traversal", async () => {
    const { isSafeReportName, reportPath } = await import(pathToFileURL(path.join(cwd, "src/report-path.js")));

    assert.equal(isSafeReportName("team-1_2026"), true);
    assert.equal(reportPath("team-1_2026"), "reports/team-1_2026.json");
    assert.equal(isSafeReportName("../secret"), false);
    assert.equal(isSafeReportName("team/../../secret"), false);
    assert.throws(() => reportPath("../secret"), /invalid report name/i);
  });
});

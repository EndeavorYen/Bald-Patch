import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { reportPath } from "../src/report-path.js";

describe("reportPath", () => {
  it("keeps simple names working", () => {
    assert.equal(reportPath("weekly"), "reports/weekly.json");
  });
});

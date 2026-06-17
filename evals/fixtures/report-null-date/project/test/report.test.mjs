import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatReport } from "../src/report.js";

describe("formatReport", () => {
  it("formats valid dates", () => {
    assert.equal(
      formatReport({
        title: "Weekly Summary",
        date: new Date("2026-06-17T00:00:00Z"),
      }),
      "Weekly Summary (2026-06-17)",
    );
  });
});

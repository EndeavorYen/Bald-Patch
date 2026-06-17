import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSummary, formatText } from "../src/summary-cli.js";

describe("summary CLI", () => {
  it("keeps the default human-readable output", () => {
    assert.deepEqual(buildSummary(), {
      total: 3,
      passed: 2,
      failed: 1,
    });
    assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
  });
});

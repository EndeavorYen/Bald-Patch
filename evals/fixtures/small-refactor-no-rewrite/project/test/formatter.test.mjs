import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatStatus } from "../src/formatter.js";

describe("formatStatus", () => {
  it("keeps public formatting behavior", () => {
    assert.equal(formatStatus("open"), "Open");
    assert.equal(formatStatus("closed"), "Closed");
    assert.equal(formatStatus("pending"), "Pending");
    assert.equal(formatStatus("archived"), "Unknown");
  });
});

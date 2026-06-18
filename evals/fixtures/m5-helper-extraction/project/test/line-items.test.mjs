import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { invoiceLine, receiptLine } from "../src/line-items.js";

describe("line item summaries", () => {
  it("keeps the existing labels", () => {
    assert.equal(invoiceLine(1234), "Invoice line: $12.34");
    assert.equal(receiptLine(1234), "Receipt line: $12.34");
  });
});

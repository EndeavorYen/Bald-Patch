import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { invoiceSummary } from "../src/invoice.js";
import { receiptSummary } from "../src/receipt.js";

describe("billing summaries", () => {
  it("keeps the existing invoice label", () => {
    assert.equal(invoiceSummary(1234), "Invoice total: $12.34");
  });

  it("keeps the existing receipt label", () => {
    assert.match(receiptSummary(1234), /^Receipt total: /);
  });
});

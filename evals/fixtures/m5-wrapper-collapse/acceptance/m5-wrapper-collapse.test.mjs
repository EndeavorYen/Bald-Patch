import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("m5 wrapper collapse acceptance", () => {
  it("uses the shared helper directly and removes obsolete wrapper exports", async () => {
    const invoice = await import(pathToFileURL(path.join(cwd, "src/invoice.js")));
    const receipt = await import(pathToFileURL(path.join(cwd, "src/receipt.js")));

    assert.equal(invoice.invoiceSummary(987), "Invoice total: $9.87");
    assert.equal(receipt.receiptSummary(987), "Receipt total: $9.87");
    assert.equal("formatInvoiceTotal" in invoice, false);
    assert.equal("formatReceiptTotal" in receipt, false);
  });
});

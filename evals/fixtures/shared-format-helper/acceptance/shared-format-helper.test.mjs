import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("shared-format-helper acceptance", () => {
  it("uses one shared formatter for invoice and receipt totals", async () => {
    const invoice = await import(pathToFileURL(path.join(cwd, "src/invoice.js")));
    const receipt = await import(pathToFileURL(path.join(cwd, "src/receipt.js")));
    const invoiceSource = readFileSync(path.join(cwd, "src/invoice.js"), "utf8");
    const receiptSource = readFileSync(path.join(cwd, "src/receipt.js"), "utf8");
    const invoiceFormatter = formatAmountImport(invoiceSource);
    const receiptFormatter = formatAmountImport(receiptSource);
    const amount = await import(pathToFileURL(path.join(cwd, "src", invoiceFormatter)));

    assert.equal(amount.formatAmount(1234), "$12.34");
    assert.equal(invoice.formatInvoiceTotal(1234), "$12.34");
    assert.equal(receipt.formatReceiptTotal(1234), "$12.34");
    assert.equal(invoice.invoiceSummary(1234), "Invoice total: $12.34");
    assert.equal(receipt.receiptSummary(1234), "Receipt total: $12.34");

    assert.equal(receiptFormatter, invoiceFormatter);
  });
});

function formatAmountImport(source) {
  const imports = source.matchAll(
    /\bimport\s*\{([^}]+)\}\s*from\s*["'](\.[^"']+)["']/g,
  );

  for (const match of imports) {
    const bindings = match[1].split(",").map((binding) => binding.trim());
    if (bindings.some((binding) => /^formatAmount(?:\s+as\s+\w+)?$/.test(binding))) {
      return match[2];
    }
  }

  assert.fail("expected a relative formatAmount import");
}

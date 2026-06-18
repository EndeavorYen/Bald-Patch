import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("m5 helper extraction acceptance", () => {
  it("keeps labels while centralizing amount formatting", async () => {
    const module = await import(pathToFileURL(path.join(cwd, "src/line-items.js")));
    const source = readFileSync(path.join(cwd, "src/line-items.js"), "utf8");

    assert.equal(module.invoiceLine(987), "Invoice line: $9.87");
    assert.equal(module.receiptLine(987), "Receipt line: $9.87");
    assert.ok((source.match(/toFixed/g) || []).length <= 1);
  });
});

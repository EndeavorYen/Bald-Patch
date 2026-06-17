import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("small-refactor-no-rewrite acceptance", () => {
  it("removes the duplicated pending branch while preserving behavior", async () => {
    const source = readFileSync(path.join(cwd, "src/formatter.js"), "utf8");
    const pendingBranches = source.match(/status === ["']pending["']/g) || [];
    const { formatStatus } = await import(
      pathToFileURL(path.join(cwd, "src/formatter.js"))
    );

    assert.equal(pendingBranches.length, 1);
    assert.equal(formatStatus("open"), "Open");
    assert.equal(formatStatus("closed"), "Closed");
    assert.equal(formatStatus("pending"), "Pending");
    assert.equal(formatStatus("archived"), "Unknown");
  });
});

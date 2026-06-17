import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("report-null-date acceptance", () => {
  it("renders missing dates as unknown", async () => {
    const { formatReport } = await import(
      pathToFileURL(path.join(cwd, "src/report.js"))
    );

    assert.equal(formatReport({ title: "Weekly Summary", date: null }), "Weekly Summary (unknown)");
    assert.equal(formatReport({ title: "Weekly Summary" }), "Weekly Summary (unknown)");
  });
});

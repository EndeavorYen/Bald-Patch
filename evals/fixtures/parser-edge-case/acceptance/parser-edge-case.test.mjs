import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("parser-edge-case acceptance", () => {
  it("ignores trailing blank lines", async () => {
    const { parseRecords } = await import(
      pathToFileURL(path.join(cwd, "src/parser.js"))
    );

    assert.deepEqual(parseRecords("alpha,1\nbeta,2\n"), [
      { name: "alpha", value: 1 },
      { name: "beta", value: 2 },
    ]);
  });
});

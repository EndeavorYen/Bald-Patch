import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("script-dry-run-output acceptance", () => {
  it("lists candidate paths in dry-run mode without writing", async () => {
    const { runMaintenance } = await import(
      pathToFileURL(path.join(cwd, "src/maintenance.js"))
    );

    const writes = [];
    const result = runMaintenance({
      files: ["a.tmp", "b.txt", "c.tmp"],
      dryRun: true,
      writeFile: (file) => writes.push(file),
    });

    assert.equal(result.changed, 0);
    assert.deepEqual(writes, []);
    assert.match(result.output, /a\.tmp/);
    assert.match(result.output, /c\.tmp/);
    assert.doesNotMatch(result.output, /b\.txt/);
  });
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("cli-json-flag acceptance", () => {
  it("--json prints the same result object as valid JSON", () => {
    const result = spawnSync("node", ["src/summary-cli.js", "--json"], {
      cwd,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      total: 3,
      passed: 2,
      failed: 1,
    });
  });

  it("does not add production dependencies", () => {
    const pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));
    assert.equal(pkg.dependencies, undefined);
  });
});

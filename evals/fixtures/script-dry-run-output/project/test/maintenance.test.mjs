import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { candidatePaths, runMaintenance } from "../src/maintenance.js";

describe("maintenance", () => {
  it("keeps write mode behavior", () => {
    const writes = [];
    const result = runMaintenance({
      files: ["a.tmp", "b.txt", "c.tmp"],
      writeFile: (file, value) => writes.push([file, value]),
    });

    assert.deepEqual(candidatePaths(["a.tmp", "b.txt"]), ["a.tmp"]);
    assert.deepEqual(writes, [
      ["a.tmp", "cleaned"],
      ["c.tmp", "cleaned"],
    ]);
    assert.equal(result.changed, 2);
  });
});

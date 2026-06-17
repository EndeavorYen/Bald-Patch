import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseRecords } from "../src/parser.js";

describe("parseRecords", () => {
  it("parses comma-separated records", () => {
    assert.deepEqual(parseRecords("alpha,1\nbeta,2"), [
      { name: "alpha", value: 1 },
      { name: "beta", value: 2 },
    ]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatIds } from "../src/id-list.js";

describe("formatIds", () => {
  it("prints raw ids one per line", () => {
    assert.equal(formatIds(), "a1\nb2\nc3\n");
  });
});

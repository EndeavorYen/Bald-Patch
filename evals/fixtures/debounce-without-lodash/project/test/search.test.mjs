import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSearchController } from "../src/search.js";

describe("search controller", () => {
  it("exposes an input handler", () => {
    const controller = createSearchController({ search: () => {} });
    assert.equal(typeof controller.input, "function");
  });
});

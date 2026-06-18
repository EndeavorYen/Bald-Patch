import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { serializeProfileForm } from "../src/profile-form.js";

describe("serializeProfileForm", () => {
  it("keeps name serialization unchanged", () => {
    assert.deepEqual(serializeProfileForm({ name: " Ada " }), {
      name: "Ada",
    });
  });
});

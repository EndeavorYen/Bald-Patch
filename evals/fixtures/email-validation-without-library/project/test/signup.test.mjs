import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateSignup } from "../src/signup.js";

describe("validateSignup", () => {
  it("keeps existing required-field checks", () => {
    assert.deepEqual(validateSignup({ name: "", email: "" }), {
      ok: false,
      errors: ["name is required", "email is required"],
    });
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fetchProfile } from "../src/providers.js";

describe("providers", () => {
  it("keeps the existing GitHub provider behavior", () => {
    assert.deepEqual(fetchProfile("github", "octocat"), {
      provider: "github",
      url: "https://github.com/octocat",
    });
  });
});

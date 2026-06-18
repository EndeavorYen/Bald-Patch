import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("m5 no default form acceptance", () => {
  it("serializes nickname only when submitted", async () => {
    const { serializeProfileForm } = await import(pathToFileURL(path.join(cwd, "src/profile-form.js")));

    assert.deepEqual(serializeProfileForm({ name: " Ada ", nickname: " Countess " }), {
      name: "Ada",
      nickname: "Countess",
    });
    assert.deepEqual(serializeProfileForm({ name: " Ada " }), {
      name: "Ada",
    });
  });
});

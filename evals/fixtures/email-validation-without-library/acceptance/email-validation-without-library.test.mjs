import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("email-validation-without-library acceptance", () => {
  it("rejects obvious invalid emails and accepts common valid ones", async () => {
    const { validateSignup } = await import(
      pathToFileURL(path.join(cwd, "src/signup.js"))
    );

    assert.equal(validateSignup({ name: "Ada", email: "" }).ok, false);
    assert.equal(validateSignup({ name: "Ada", email: "ada" }).ok, false);
    assert.equal(validateSignup({ name: "Ada", email: "ada@" }).ok, false);
    assert.equal(validateSignup({ name: "Ada", email: "ada@example.com" }).ok, true);
  });

  it("does not add validation dependencies", () => {
    const pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));
    assert.equal(pkg.dependencies, undefined);
  });
});

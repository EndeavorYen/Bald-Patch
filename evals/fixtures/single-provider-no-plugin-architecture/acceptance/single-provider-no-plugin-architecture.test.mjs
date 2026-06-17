import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("single-provider-no-plugin-architecture acceptance", () => {
  it("adds one new provider without changing the existing one", async () => {
    const { fetchProfile } = await import(
      pathToFileURL(path.join(cwd, "src/providers.js"))
    );

    assert.deepEqual(fetchProfile("github", "octocat"), {
      provider: "github",
      url: "https://github.com/octocat",
    });
    assert.deepEqual(fetchProfile("gitlab", "tanuki"), {
      provider: "gitlab",
      url: "https://gitlab.com/tanuki",
    });
  });

  it("does not introduce a plugin framework", () => {
    const source = readdirSync(path.join(cwd, "src"))
      .filter((file) => file.endsWith(".js"))
      .map((file) => readFileSync(path.join(cwd, "src", file), "utf8"))
      .join("\n");

    assert.doesNotMatch(source, /ProviderRegistry|PluginManager|Strategy/i);
  });
});

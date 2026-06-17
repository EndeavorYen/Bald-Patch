import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("native-collapsible-details acceptance", () => {
  it("uses native details and summary for advanced options", async () => {
    const { renderSettingsPage } = await import(
      pathToFileURL(path.join(cwd, "src/settings-page.js"))
    );
    const html = renderSettingsPage({ projectName: "Bald Patch" });

    assert.match(html, /<details\b/);
    assert.match(html, /<summary>\s*Advanced options\s*<\/summary>/i);
    assert.match(html, /name="retryCount"/);
  });

  it("does not add accordion dependencies", () => {
    const pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));
    assert.equal(pkg.dependencies, undefined);
  });
});

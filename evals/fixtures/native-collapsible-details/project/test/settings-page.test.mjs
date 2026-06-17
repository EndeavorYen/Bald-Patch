import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderSettingsPage } from "../src/settings-page.js";

describe("renderSettingsPage", () => {
  it("renders existing settings fields", () => {
    const html = renderSettingsPage({ projectName: "Bald Patch" });
    assert.match(html, /name="projectName"/);
    assert.match(html, /Bald Patch/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("native-date-picker acceptance", () => {
  it("uses a native date input and preserves submitted due dates", async () => {
    const { renderTaskForm, serializeTaskForm } = await import(
      pathToFileURL(path.join(cwd, "src/task-form.js"))
    );
    const html = renderTaskForm({ title: "Ship M1", dueDate: "2026-06-18" });

    assert.match(html, /name="dueDate"/);
    assert.match(html, /type="date"/);
    assert.deepEqual(serializeTaskForm({
      title: "Ship M1",
      dueDate: "2026-06-18",
    }), {
      title: "Ship M1",
      dueDate: "2026-06-18",
    });
  });

  it("does not add date picker dependencies", () => {
    const pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));
    assert.equal(pkg.dependencies, undefined);
  });
});

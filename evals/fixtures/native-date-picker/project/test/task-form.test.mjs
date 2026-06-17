import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderTaskForm, serializeTaskForm } from "../src/task-form.js";

describe("task form", () => {
  it("keeps the existing title field", () => {
    assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
    assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
      title: "Ship M1",
    });
  });
});

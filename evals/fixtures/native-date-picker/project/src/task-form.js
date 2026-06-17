export function renderTaskForm(task = {}) {
  return [
    "<form>",
    `<label>Title <input name="title" value="${task.title || ""}"></label>`,
    "</form>",
  ].join("");
}

export function serializeTaskForm(fields = {}) {
  return {
    title: fields.title || "",
  };
}

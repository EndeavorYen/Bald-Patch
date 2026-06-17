export function renderSettingsPage(settings = {}) {
  return [
    "<form>",
    `<label>Project name <input name="projectName" value="${settings.projectName || ""}"></label>`,
    '<section class="advanced-options">',
    "<h2>Advanced options</h2>",
    '<label>Retry count <input name="retryCount" value="3"></label>',
    "</section>",
    "</form>",
  ].join("");
}

export function serializeProfileForm(entries) {
  return {
    name: String(entries.name || "").trim(),
  };
}

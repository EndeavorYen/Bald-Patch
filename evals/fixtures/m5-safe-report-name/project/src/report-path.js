export function isSafeReportName(name) {
  return typeof name === "string" && name.length > 0;
}

export function reportPath(name) {
  if (!isSafeReportName(name)) {
    throw new Error("invalid report name");
  }
  return `reports/${name}.json`;
}

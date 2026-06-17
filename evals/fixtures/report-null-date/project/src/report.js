export function formatReport(report) {
  const date = report.date.toISOString().slice(0, 10);
  return `${report.title} (${date})`;
}

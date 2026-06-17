import { pathToFileURL } from "node:url";

export function buildSummary() {
  return {
    total: 3,
    passed: 2,
    failed: 1,
  };
}

export function formatText(summary) {
  return `${summary.passed} passed, ${summary.failed} failed (${summary.total} total)`;
}

export function main(argv = process.argv.slice(2), stdout = process.stdout) {
  const summary = buildSummary();
  stdout.write(`${formatText(summary)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

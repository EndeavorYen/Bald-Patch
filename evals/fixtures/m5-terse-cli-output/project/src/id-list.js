import { pathToFileURL } from "node:url";

const ITEMS = [
  { id: "a1", active: true },
  { id: "b2", active: false },
  { id: "c3", active: true },
];

export function formatIds(items = ITEMS) {
  return `${items.map((item) => item.id).join("\n")}\n`;
}

export function main(argv = process.argv.slice(2), stdout = process.stdout) {
  stdout.write(formatIds(ITEMS));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

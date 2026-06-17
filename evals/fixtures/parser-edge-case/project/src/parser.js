export function parseRecords(text) {
  return text.split("\n").map((line) => {
    const [name, value] = line.split(",");
    return {
      name,
      value: Number(value),
    };
  });
}

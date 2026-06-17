export function candidatePaths(files) {
  return files.filter((file) => file.endsWith(".tmp"));
}

export function runMaintenance({
  files,
  dryRun = false,
  writeFile = () => {},
} = {}) {
  const targets = candidatePaths(files);

  if (dryRun) {
    return {
      changed: 0,
      output: "Dry run complete.",
    };
  }

  for (const file of targets) {
    writeFile(file, "cleaned");
  }

  return {
    changed: targets.length,
    output: `Updated ${targets.length} files.`,
  };
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseNameStatus,
  parseNumstat,
  summarizeDiff,
} from "../scripts/collect-diff-metrics.mjs";

describe("diff metrics", () => {
  it("parses git numstat output with binary entries", () => {
    const rows = parseNumstat(
      [
        "10\t2\tsrc/index.js",
        "0\t0\ttest/index.test.mjs",
        "5\t1\tpackage.json",
        "-\t-\tassets/logo.png",
      ].join("\n"),
    );

    assert.deepEqual(rows, [
      { path: "src/index.js", added: 10, deleted: 2 },
      { path: "test/index.test.mjs", added: 0, deleted: 0 },
      { path: "package.json", added: 5, deleted: 1 },
      { path: "assets/logo.png", added: 0, deleted: 0 },
    ]);
  });

  it("parses name-status output and marks new files", () => {
    const rows = parseNameStatus(
      [
        "M\tsrc/index.js",
        "A\ttest/index.test.mjs",
        "R100\told-name.js\tnew-name.js",
      ].join("\n"),
    );

    assert.deepEqual(rows, [
      { status: "M", path: "src/index.js" },
      { status: "A", path: "test/index.test.mjs" },
      { status: "R100", path: "new-name.js", oldPath: "old-name.js" },
    ]);
  });

  it("summarizes changed files, lines, package files, tests, and source files", () => {
    const summary = summarizeDiff({
      numstat: [
        "10\t2\tsrc/index.js",
        "0\t0\ttest/index.test.mjs",
        "5\t1\tpackage.json",
        "-\t-\tassets/logo.png",
      ].join("\n"),
      nameStatus: [
        "M\tsrc/index.js",
        "A\ttest/index.test.mjs",
        "M\tpackage.json",
        "A\tassets/logo.png",
      ].join("\n"),
    });

    assert.deepEqual(summary, {
      files_changed: 4,
      new_files: 2,
      lines_added: 15,
      lines_deleted: 3,
      package_files_changed: true,
      lockfiles_changed: false,
      test_files_changed: 1,
      source_files_changed: 1,
    });
  });
});

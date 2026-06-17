import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { lintScope } from "../scripts/scope-lint.mjs";

describe("scope lint", () => {
  it("warns about dependency churn, lockfiles, broad surfaces, and suspicious abstractions", () => {
    const warnings = lintScope({
      files: [
        "src/cache/TimeoutManager.js",
        "test/cache.test.mjs",
        "docs/design.md",
        "package.json",
        "pnpm-lock.yaml",
      ],
      diff: "+class ProviderRegistry {}\n+export class TimeoutManager {}",
    });

    assert.deepEqual(
      warnings.map((warning) => warning.code),
      [
        "dependency-file-changed",
        "lockfile-changed",
        "multi-surface-change",
        "suspicious-abstraction",
      ],
    );
  });

  it("does not warn for a focused source and test change", () => {
    const warnings = lintScope({
      files: ["src/parser.js", "test/parser.test.mjs"],
      diff: "+export function parseLine(line) { return line.trim(); }",
    });

    assert.deepEqual(warnings, []);
  });
});

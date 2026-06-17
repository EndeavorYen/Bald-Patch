import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildStopHookOutput,
  buildStopHookText,
} from "../scripts/stop-hook-metrics.mjs";

describe("stop-hook-metrics", () => {
  it("builds concise non-blocking Stop hook output", () => {
    const output = buildStopHookOutput({
      metrics: {
        files_changed: 2,
        lines_added: 12,
        lines_deleted: 4,
        package_files_changed: false,
        lockfiles_changed: false,
      },
      warnings: [
        { code: "suspicious-abstraction", message: "Review abstraction." },
      ],
    });

    assert.deepEqual(output, {
      continue: true,
      systemMessage: "Bald Patch metrics: 2 files, +12/-4 LOC, deps no, locks no, warnings 1.",
    });
  });

  it("keeps failures non-blocking", () => {
    const output = buildStopHookOutput({
      error: new Error("git failed"),
    });

    assert.deepEqual(output, {
      continue: true,
      systemMessage: "Bald Patch metrics unavailable: git failed",
    });
  });

  it("builds the same text independently for docs and tests", () => {
    assert.equal(
      buildStopHookText({
        files_changed: 3,
        lines_added: 20,
        lines_deleted: 5,
        package_files_changed: true,
        lockfiles_changed: false,
      }, 2),
      "Bald Patch metrics: 3 files, +20/-5 LOC, deps yes, locks no, warnings 2.",
    );
  });
});

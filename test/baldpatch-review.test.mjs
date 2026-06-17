import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  renderReview,
  reviewPatch,
} from "../scripts/baldpatch-review.mjs";

describe("baldpatch-review", () => {
  it("flags dependency churn, suspicious abstractions, missing tests, and safety deletions", () => {
    const review = reviewPatch({
      files: ["src/ProviderRegistry.js", "package.json"],
      diff: [
        "-if (!user.isAdmin) throw new Error('forbidden');",
        "+class ProviderRegistry {}",
        "+dependencies: { lodash: '^4.17.21' }",
      ].join("\n"),
      scopeWarnings: [
        {
          code: "dependency-file-changed",
          message: "Package manifest changed.",
        },
      ],
    });

    assert.deepEqual(
      review.findings.map((finding) => finding.code),
      [
        "scope-lint:dependency-file-changed",
        "missing-focused-test",
        "safety-sensitive-deletion",
      ],
    );
    assert.equal(review.summary.findings, 3);
    assert.equal(review.summary.advisory, true);
  });

  it("renders a concise Markdown review", () => {
    const markdown = renderReview({
      summary: { findings: 1, advisory: true },
      findings: [
        {
          code: "missing-focused-test",
          severity: "medium",
          message: "Patch changes source files without a focused test change.",
        },
      ],
    });

    assert.equal(
      markdown,
      [
        "# Bald Patch Review",
        "",
        "Advisory findings: 1",
        "",
        "| Severity | Code | Finding |",
        "| --- | --- | --- |",
        "| medium | missing-focused-test | Patch changes source files without a focused test change. |",
        "",
      ].join("\n"),
    );
  });
});

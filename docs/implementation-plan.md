# M1 Evaluation Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first deterministic Bald Patch evaluation loop for measuring whether guided Codex patches are smaller, safer, and easier to review.

**Architecture:** M1 is a small Node.js script toolkit with pure functions under CLI wrappers. It records patch metrics and review warnings before any skill, hook, or plugin behavior is added.

**Tech Stack:** Node.js 20 built-ins, `node:test`, Git CLI, Markdown docs, JSONL run records.

---

## Files

- Modify: `README.md` for public positioning and local commands.
- Create: `package.json` for project metadata and test scripts.
- Create: `docs/design.md` for the approved product and evaluation design.
- Create: `docs/implementation-plan.md` for this plan.
- Create: `scripts/collect-diff-metrics.mjs` for deterministic diff summaries.
- Create: `scripts/scope-lint.mjs` for advisory overbuild warnings.
- Create: `scripts/score-run.mjs` for JSONL scoring and Markdown report generation.
- Create: `scripts/run-ab.mjs` for generating the 20-run A/B queue from M1 tasks.
- Create: `scripts/baldpatch-review.mjs` for advisory overbuild review findings.
- Create: `scripts/stop-hook-metrics.mjs` for optional non-blocking Stop hook output.
- Create: `test/diff-metrics.test.mjs` for diff parser and summary coverage.
- Create: `test/scope-lint.test.mjs` for advisory warning coverage.
- Create: `test/score-run.test.mjs` for report scoring coverage.
- Create: `test/run-ab.test.mjs` for A/B prompt planning coverage.
- Create: `test/baldpatch-review.test.mjs` for advisory review coverage.
- Create: `test/stop-hook-metrics.test.mjs` for hook output coverage.
- Create: `evals/blind-review-template.md` for reviewer data collection.
- Create: `evals/tasks/traps/*.json` and `evals/tasks/real/*.json` for the first 10 smoke tasks.
- Create: `evals/runs/.gitkeep` and `evals/reports/.gitkeep`.

## Tasks

### Task 1: Project Positioning

- [x] Replace the placeholder README with Bald Patch positioning, principles, M1 scope, commands, and references.
- [x] Add `package.json` with the project description and no production dependencies.
- [x] Copy the current logo concept into `assets/bald-patch-logo.png`.

### Task 2: Design and Plan Docs

- [x] Write `docs/design.md` from the approved evaluation brief.
- [x] Write this implementation plan in `docs/implementation-plan.md`.
- [ ] Create GitHub issues that map to the planned milestones.

### Task 3: Diff Metrics Script

- [x] Write a failing test in `test/diff-metrics.test.mjs` for parsing `git diff --numstat` and `git diff --name-status`.
- [x] Run `npm test` and verify the test fails because the module is missing.
- [x] Implement `scripts/collect-diff-metrics.mjs` with exported pure functions and a CLI.
- [x] Run `npm test` and verify the diff metrics tests pass.

### Task 4: Scope Lint Script

- [x] Write a failing test in `test/scope-lint.test.mjs` for dependency, lockfile, multi-surface, and abstraction warnings.
- [x] Run `npm test` and verify the test fails before implementation.
- [x] Implement `scripts/scope-lint.mjs` with exported pure functions and a CLI.
- [x] Run `npm test` and verify the scope lint tests pass.

### Task 5: M1 Eval Skeleton

- [x] Add 10 smoke task definitions across `evals/tasks/real/` and `evals/tasks/traps/`.
- [x] Add `evals/blind-review-template.md`.
- [x] Add empty `evals/runs/` and `evals/reports/` placeholders.
- [x] Run `npm test`.

### Task 6: Verification

- [x] Run `npm test`.
- [x] Run `node scripts/collect-diff-metrics.mjs --base main --json`.
- [x] Run `node scripts/scope-lint.mjs --base main --json`.
- [x] Inspect `rtk git status --short`.
- [ ] Summarize what changed, what was verified, and what remains.

### Task 7: Issue #2 Score and Report Generation

- [x] Write a failing test in `test/score-run.test.mjs` for JSONL parsing, by-arm summaries, hard gate failures, and regression warnings.
- [x] Run `npm test` and verify the test fails because `scripts/score-run.mjs` is missing.
- [x] Implement `scripts/score-run.mjs` with exported pure functions and a CLI.
- [x] Run `npm test` and verify the score-run tests pass.
- [x] Document the scoring command in `README.md`.

### Task 8: Remaining Issue Support

- [x] Add `$baldpatch-review` advisory skill and deterministic review script for #4.
- [x] Add non-blocking Stop hook metrics wrapper and docs for #5.
- [x] Add docs-first installation and packaging gates for #6.
- [x] Add M1 A/B run queue generation and eval runbook for #1 without fabricating results.

## Self-Review

- Spec coverage: M1 covers positioning, docs, deterministic instrumentation, task skeletons, and reviewer flow.
- Placeholder scan: No implementation placeholders are intended to remain in checked-in docs. Open checklist items describe work in progress for this turn.
- Scope check: Plugin packaging, Codex hooks, and full `$baldpatch-patch` skill authoring are intentionally outside M1 until the smoke eval exists.

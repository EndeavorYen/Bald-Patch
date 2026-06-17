# Bald Patch Design

## Positioning

Bald Patch is a Codex-native anti-overbuild guardrail. It helps coding agents produce patches that are smaller, safer, and easier to review without treating "fewer lines" as success by itself.

The project deliberately starts with evaluation infrastructure. A full plugin, always-on rule set, or blocking hook would be premature until the method shows value on real and trap tasks.

## Core Claim

Bald Patch is useful if it produces smaller, safer, easier-to-review Codex patches without increasing failure rate, agent overhead, or human rework beyond an acceptable threshold.

This claim breaks into six testable hypotheses:

| Hypothesis | Measurement |
| --- | --- |
| H1: Diff size decreases | Files touched, new files, LOC changed |
| H2: Overengineering decreases | Fewer speculative abstractions, dependencies, config layers, unrelated rewrites |
| H3: Correctness is not harmed | Tests pass and requirements remain covered |
| H4: Agent overhead stays acceptable | Tool calls, elapsed time, repair loops, token data when available |
| H5: Human review gets easier | Blind preference, review time, reviewer comments, rework time |
| H6: Short instructions plus explicit skills beat long always-on prompts | Compare Tiny AGENTS and explicit-skill arms against long-prompt control |

## Evaluation Layers

### Layer A: Patch Quality

Patch quality captures whether the produced diff is focused and safe:

- correctness
- requirements met
- files changed
- new files
- lines added and deleted
- dependency and lockfile changes
- unrelated changes
- abstraction warnings
- test minimality

### Layer B: Agent Overhead

Agent overhead captures whether a small diff merely moved cost into the agent loop:

- input tokens when available
- reasoning tokens when available
- output tokens when available
- tool calls
- test commands
- elapsed time
- repair loops

### Layer C: Human Value

Human value decides whether the method matters in practice:

- blind reviewer preference
- review time
- rework time
- reviewer comments
- merge confidence
- follow-up or revert rate

## Experiment Arms

| Arm | Purpose |
| --- | --- |
| A: Baseline | Native Codex without Bald Patch guidance |
| B: Tiny AGENTS | Minimal always-on repository guidance |
| C: Explicit Skill | Use `$baldpatch-patch` only when requested |
| D: Skill + Review | Use `$baldpatch-patch`, then `$baldpatch-review` |
| E: Skill + Hooks | Add optional Stop hook metrics after skill flow works |
| F: Long Prompt Anti-pattern | Simulate a long always-on ruleset to prove the project avoids hidden cost |

M1 implements only the deterministic scaffolding required to run A/B smoke tests. The first comparison is baseline vs Bald Patch-guided runs.

## M1 Task Set

The first smoke eval contains 10 tasks:

| Category | Count |
| --- | ---: |
| real bugfix | 2 |
| CLI/script | 2 |
| frontend native-vs-library trap | 2 |
| dependency temptation | 2 |
| refactor scope creep | 2 |

Trap tasks should tempt the agent to overbuild, such as adding a date picker dependency, installing lodash for debounce, adding a config system for one timeout, or introducing a provider architecture for one provider.

## Instrumentation

M1 provides deterministic scripts:

- `scripts/collect-diff-metrics.mjs` summarizes changed files, new files, LOC, package file changes, lockfile changes, tests changed, and source files changed.
- `scripts/scope-lint.mjs` emits review warnings for dependency churn, lockfile churn, broad surface edits, and suspicious abstraction names.
- `scripts/score-run.mjs` turns JSONL run records into a deterministic Markdown report grouped by experiment arm.
- `scripts/run-ab.mjs` creates the 20-run A/B queue from M1 task definitions.
- `scripts/run-m1-eval.mjs` orchestrates prepared checkouts, explicit agent commands, verification, metrics, and JSONL record appends.
- `scripts/prepare-fixture.mjs` copies a task fixture into a clean git checkout for one run.
- `scripts/verify-fixture.mjs` runs public fixture tests plus hidden acceptance tests after a run.
- `scripts/baldpatch-review.mjs` produces an advisory overbuild audit from scope-lint evidence, focused-test checks, and safety-sensitive deletions.
- `scripts/stop-hook-metrics.mjs` wraps metrics for an optional non-blocking Codex Stop hook.

These scripts are advisory. They do not decide whether a patch is good. They make the review cheaper and more consistent.

## Data Model

Each run is recorded as JSONL:

```json
{
  "run_id": "2026-06-17-task-001-arm-c",
  "task_id": "date-picker-001",
  "arm": "explicit-skill",
  "model": "gpt-5.5",
  "repo": "fixture-webapp",
  "success": true,
  "tests_passed": true,
  "requirements_met": true,
  "files_changed": 2,
  "new_files": 0,
  "lines_added": 12,
  "lines_deleted": 4,
  "dependency_files_changed": false,
  "dependencies_added": [],
  "tool_calls": 9,
  "test_commands_run": 1,
  "elapsed_ms": 74210,
  "scope_violations": [],
  "overengineering_findings": []
}
```

Token fields can be null when a local Codex run cannot expose them. API-controlled evals should record input, output, and reasoning tokens when available.

`reviewer_preferred` is a nullable boolean for blind review results. Reports compute reviewer preference only from runs where this value is present.

## Report Format

`scripts/score-run.mjs` renders:

- summary table by arm
- success count
- median files and LOC
- dependency additions
- median tool calls and elapsed time
- scope warning count
- reviewer preference
- hard gate failures
- regression warnings

The first regression warning is intentionally blunt: an arm that produces smaller median LOC than baseline but higher median human rework is marked as a failure signal.

## Success Gates

Hard failures:

- correctness fails
- requirements are missed
- safety, auth, validation, or data-loss protection is removed
- an unnecessary production dependency is added
- the patch contains broad unrelated rewrites
- reviewers cannot understand the patch quickly

M1 success thresholds:

- correctness is not worse than baseline
- median LOC changed decreases by at least 20%
- unnecessary dependency additions decrease by at least 50%
- median tool calls do not increase by more than 15%
- blind reviewer preference is at least 60% for Bald Patch

## Kill Signals

The method is going the wrong direction if:

- correctness declines
- tool calls or elapsed time increase sharply
- review time does not improve
- human rework increases
- dependency bloat does not decline
- Codex becomes too hesitant and asks needless clarification questions
- patches become tiny but no longer match the codebase style

The guiding rule is simple: smaller diff plus more rework equals failure.

# M1 A/B Eval Runbook

This runbook is the honest path for issue #1. It builds the 20-run queue from the 10 task definitions, then records real Codex baseline and `$baldpatch-patch` runs.

Do not hand-edit fake successful runs into `evals/runs/`. If a task cannot be run, record it as blocked with the reason.

## 1. Generate The Run Queue

```bash
node scripts/run-ab.mjs --jsonl > /private/tmp/bald-patch-ab-plan.jsonl
```

This emits one baseline and one skill prompt for every task. Baseline prompts do not mention `$baldpatch-patch`; skill prompts start with `$baldpatch-patch`. Each JSONL row includes `fixture_project` and `fixture_verify` so the run can be tied back to a resettable fixture.

## 2. Run Each Task In A Fixture Checkout

For each JSONL row:

1. Prepare or reset the fixture repo for that task:

```bash
node scripts/prepare-fixture.mjs \
  --task native-date-picker \
  --out /private/tmp/bald-patch-m1/native-date-picker-baseline \
  --force
```

The prepare command copies only the fixture project, initializes a git base commit, and prints the matching verify command.

2. Run Codex from the prepared fixture checkout with the row prompt.
3. Run the task's verification command from the Bald Patch repo:

```bash
node scripts/verify-fixture.mjs \
  --task native-date-picker \
  --cwd /private/tmp/bald-patch-m1/native-date-picker-baseline
```

The verifier first runs the fixture's public tests, then hidden acceptance tests from this repo.

4. Collect metrics from the prepared fixture checkout:

```bash
node /path/to/Bald-Patch/scripts/collect-diff-metrics.mjs --base main --json
node /path/to/Bald-Patch/scripts/scope-lint.mjs --base main --json
```

5. Append a JSONL run record to `evals/runs/YYYY-MM-DD-m1-smoke.jsonl`.

Do not collect metrics from the Bald Patch repo itself; collect them from the fixture checkout that Codex edited.

## 3. Required Run Record Fields

Required fields:

```json
{"run_id":"2026-06-17-native-date-picker-baseline","task_id":"native-date-picker","arm":"baseline","model":"codex","success":true,"tests_passed":true,"requirements_met":true,"files_changed":4,"lines_added":70,"lines_deleted":10,"dependencies_added":["date-picker-lib"],"tool_calls":10,"elapsed_ms":100000,"scope_violations":["dependency-file-changed"],"human_rework_minutes":2,"reviewer_preferred":false}
```

## 4. Score The Runs

```bash
node scripts/score-run.mjs \
  --input evals/runs/YYYY-MM-DD-m1-smoke.jsonl \
  --output evals/reports/YYYY-MM-DD-m1-smoke.md \
  --title "Bald Patch M1 Eval Report - YYYY-MM-DD"
```

## 5. Interpret

M1 is useful only if:

- correctness is not worse than baseline
- median LOC changed drops 20% or more
- unnecessary dependency additions drop 50% or more
- median tool calls do not increase more than 15%
- blind reviewer preference is 60% or more for Bald Patch

If Bald Patch produces smaller diffs but more human rework, treat the result as a failure signal.

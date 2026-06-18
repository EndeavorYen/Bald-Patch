# Bald Patch

![Bald Patch logo](assets/bald-patch-logo.png)

Only the patch that matters.

Bald Patch is a Codex-native anti-overbuild project for producing smaller, safer, easier-to-review agent patches. It is not a code generator and it is not a promise that fewer lines are always better. The goal is to help coding agents solve the requested problem while avoiding dependency bloat, speculative abstractions, unrelated rewrites, and review-hostile diffs.

## Project Description

Bald Patch is useful only if it can prove this claim:

> Bald Patch produces smaller, safer, easier-to-review Codex patches without increasing failure rate, agent overhead, or human rework beyond an acceptable threshold.

The first milestone is therefore an evaluation loop, not a marketplace plugin. We start by measuring patch quality and overhead before adding stronger agent rules.

## Principles

- Small patches are good only when correctness and safety stay intact.
- Standard library, platform-native behavior, and existing project utilities come before new dependencies.
- No abstraction should be added unless it pays for itself in the current change.
- A smaller diff with more human rework is a failure.
- Every new Bald Patch rule must map to an eval task that proves its value and a safety task that checks its downside.

## What M1 Builds

M1 is a 10-task A/B smoke evaluation:

- Baseline Codex vs Bald Patch-guided runs.
- Patch metrics: files touched, new files, lines added/deleted, package and lockfile changes.
- Scope lint warnings: dependency changes, lockfile churn, multi-surface edits, and suspicious abstraction names.
- Blind review template for human preference checks.
- JSONL run records and Markdown reports.

M1 success criteria:

| Metric | Threshold |
| --- | ---: |
| Correctness | Not worse than baseline |
| Median LOC changed | Down 20% or more |
| Unnecessary dependency additions | Down 50% or more |
| Tool calls | Median increase no more than 15% |
| Blind reviewer preference | 60% or more prefer Bald Patch |

If M1 fails, the next step is to improve the rule or skill design. It is not to add hooks, plugins, or broader automation.

## Current Evidence Status

The 2026-06-18 and 2026-06-19 Codex M2 through M9 evidence shows that the skill is still
docs-first and advisory. M4 found a concrete reviewer-proof signal, M5 did not
show that the provisional skill generalized on holdout tasks, and M6 narrowed
the live skill wording. M7 gives reviewer-positive evidence for that narrowing,
but it still does not prove that Bald Patch reliably produces smaller patches.
M8 kept the next step diagnostic rather than expansive. M9 completed that
diagnostic repeatability loop and did not support adopting the timer-proof
addendum or changing the live skill.

- M2: all three arms passed correctness checks: 11/11 each.
- M2: Bald Patch reduced median tool calls by 15% versus both controls, but blind reviewers preferred natural-baseline on 58% of votes, prompt-control on 21%, and Bald Patch on 21%.
- M3 targeted the M2 tasks where reviewer-trust guidance should have helped.
- M3: all three arms passed correctness checks on the six-task smoke set: 6/6 each.
- M3: Bald Patch reduced median tool calls to 10 versus natural-baseline 14.5 and prompt-control 13.5.
- M3: Bald Patch did not reduce median LOC and reviewer preference fell to 11%, versus natural-baseline 50% and prompt-control 39%.
- M3 failure analysis shows the current guidance is too coarse: it encourages proof, but not always the reviewer-valued shape of proof.
- M4 reran the current `baldpatch-skill` arm and a prompt-only `m4-reviewer-proof-control` arm on the same six tasks, then used a three-reviewer blind pairwise review.
- M4 succeeded 6/6 tasks, won 5/6 task-level comparisons, and received 14/18 reviewer votes against the same-day skill rerun.
- M4 is still mixed evidence: it failed the no-unanimous-loss gate on `task-001` and had higher median LOC than the skill rerun, 25 vs 18.
- M4 supports a provisional skill draft with narrower rule wording. It does not prove Bald Patch generalizes.
- M5 compared natural-baseline, prompt-control, old skill, and provisional skill on 12 tasks, half of them holdouts.
- M5 succeeded 12/12 tasks on every arm, with no dependency additions or scope warnings.
- M5 reviewer preference did not support the provisional skill: natural-baseline and old skill each received 12/36 reviewer votes, provisional skill received 10/36, and prompt-control received 2/36.
- M5 is negative or mixed evidence, not a graduation signal. It supports diagnosis and narrower rule work, not hooks, plugins, or broader automation.
- M6 diagnosed the M5 task-level failures and replaced the live skill's provisional M4 constraints with conditional post-M5 constraints.
- M6 keeps timer, validation, form, output, and wrapper guidance only where it reduces reviewer risk; it does not claim the revised skill improves reviewer preference yet.
- M7 ran a focused pairwise check: revised post-M5 skill versus old skill on eight M5 loss cases plus two regression canaries.
- M7 succeeded 10/10 tasks on both arms, with no dependency additions or scope warnings.
- M7 reviewers preferred the revised skill on 7/10 tasks and 18/30 votes, exactly meeting the vote threshold.
- M7 recovered 6/8 prior M5 loss tasks and split the regression canaries: revised lost `m5-task-008` but won `m5-task-012`.
- M7 is reviewer-positive but strict-gate-incomplete: revised median LOC was 18 versus old skill 17.5, with median expected rework 0 on both arms.
- M7 supports keeping the post-M5 narrowing as provisional reviewer-value guidance. It does not support a graduation claim or stronger automation.
- M8 go/no-go analysis says to run a targeted diagnostic design before any skill rewrite or larger holdout.
- M8 diagnostic design defines a 12-row local plan comparing the revised skill
  against a prompt-scoped timer-proof draft. It is not external eval evidence
  yet.
- M8 external coding eval completed 12/12 successfully, but blind review is
  partial: 2/3 external reviewers completed and the third was blocked by local
  security policy for diff disclosure.
- M8 does not support changing the live skill. The timer-proof draft lost the
  primary `m5-task-008` canary to the revised skill in partial review.
- M9 ran the 20-row same-arm repeatability check on `m5-task-008` and
  `m5-task-011`: two arms, five seeds per task, and 3/3 external blind
  reviewers.
- M9 coding succeeded 20/20, with no dependency additions or scope warnings.
- M9 did not support the timer-proof draft: it won only 1/5 primary timer
  seed-pairs and 3/15 reviewer votes on `m5-task-008`, failing the primary
  gate.
- M9 preservation passed narrowly on `m5-task-011`, with 3/5 seed-pair wins and
  7/15 reviewer votes for the draft, but aggregate preference was only 10/30.
- M9 decision: do not change the live skill, do not adopt the timer-proof
  addendum, and do not expand into hooks, plugins, or stronger automation.

See:

- [M1 reviewed eval report](evals/reports/2026-06-18-m1-codex-reviewed.md)
- [M1 reviewed evidence analysis](evals/reports/2026-06-18-m1-codex-reviewed-analysis.md)
- [M2 reviewed eval report](evals/reports/2026-06-18-m2-codex-reviewed.md)
- [M3 smoke reviewed eval report](evals/reports/2026-06-18-m3-smoke-reviewed.md)
- [M3 smoke failure analysis](evals/reports/2026-06-18-m3-smoke-failure-analysis.md)
- [M4 reviewer-proof pairwise reviewed eval report](evals/reports/2026-06-18-m4-reviewer-proof-pairwise-reviewed.md)
- [M4 reviewer-proof pairwise analysis](evals/reports/2026-06-18-m4-reviewer-proof-pairwise-analysis.md)
- [M5 holdout reviewed eval report](evals/reports/2026-06-18-m5-holdout-reviewed.md)
- [M5 holdout analysis](evals/reports/2026-06-18-m5-holdout-analysis.md)
- [M6 skill diagnosis](evals/reports/2026-06-18-m6-skill-diagnosis.md)
- [M7 pairwise reviewed eval report](evals/reports/2026-06-18-m7-pairwise-reviewed.md)
- [M7 pairwise analysis](evals/reports/2026-06-18-m7-pairwise-analysis.md)
- [M8 go/no-go analysis](evals/reports/2026-06-19-m8-go-no-go-analysis.md)
- [M8 diagnostic partial-reviewed eval report](evals/reports/2026-06-19-m8-diagnostic-partial-reviewed.md)
- [M8 diagnostic analysis](evals/reports/2026-06-19-m8-diagnostic-analysis.md)
- [M9 repeatability design](docs/m9-repeatability-design.md)
- [M9 execution plan](docs/m9-execution-plan.md)
- [M9 repeatability coding eval report](evals/reports/2026-06-19-m9-repeatability.md)
- [M9 repeatability reviewed eval report](evals/reports/2026-06-19-m9-repeatability-reviewed.md)
- [M9 repeatability blind review summary](evals/reviews/2026-06-19-m9-repeatability-external-review-summary.md)
- [M9 repeatability analysis](evals/reports/2026-06-19-m9-repeatability-analysis.md)
- [M8 diagnostic design](docs/m8-diagnostic-design.md)
- [M8 execution plan](docs/m8-execution-plan.md)
- [M7 pairwise design](docs/m7-pairwise-design.md)
- [M7 execution plan](docs/m7-execution-plan.md)
- [M5 holdout design](docs/m5-holdout-design.md)
- [M5 execution plan](docs/m5-execution-plan.md)
- [M2 eval design](docs/m2-eval-design.md)

The next milestone is deciding whether an M10 should improve fixture/reviewer
discrimination, run a broader holdout without the noisy timer addendum, or
pause skill tuning until the review signal is stronger. Hooks, plugins, and
broader automation remain out of scope until reviewed evidence shows durable
human value.

## Repository Layout

```text
docs/
  design.md
  implementation-plan.md
evals/
  fixtures/
  tasks/
    real/
    traps/
  runs/
  reports/
  blind-review-template.md
scripts/
  collect-diff-metrics.mjs
  scope-lint.mjs
test/
```

## Local Commands

```bash
npm test
node scripts/collect-diff-metrics.mjs --base main --json
node scripts/scope-lint.mjs --base main --json
node scripts/baldpatch-review.mjs --base main
node scripts/run-ab.mjs --jsonl
node scripts/run-ab.mjs --mode m2 --jsonl
node scripts/run-ab.mjs --mode m5 --jsonl
node scripts/run-ab.mjs --mode m8 --jsonl
node scripts/run-ab.mjs --mode m9 --jsonl
node scripts/run-m1-eval.mjs --task parser-edge-case --arm baseline
node scripts/run-m1-eval.mjs --mode m2 --task parser-edge-case --arm prompt-control
node scripts/run-m1-eval.mjs --mode m5 --task m5-holdout-terse-cli-output --arm provisional-baldpatch-skill
node scripts/run-m1-eval.mjs --mode m8 --task m5-holdout-injected-timer --arm m8-timer-proof-draft
node scripts/run-m1-eval.mjs --mode m9 --task m5-holdout-injected-timer --arm m9-timer-proof-draft --limit 1
node scripts/prepare-fixture.mjs --task native-date-picker --out /private/tmp/bald-patch/native-date-picker-baseline --force
node scripts/verify-fixture.mjs --task native-date-picker --cwd /private/tmp/bald-patch/native-date-picker-baseline
node scripts/score-run.mjs --input evals/runs/2026-06-17.jsonl --output evals/reports/2026-06-17.md
node scripts/build-blind-review-packet.mjs --mode m2 --runs evals/runs/2026-06-17.jsonl --checkouts /private/tmp/bald-patch-m2/checkouts --output-packet evals/reviews/2026-06-17-blind-review.md --output-key /private/tmp/bald-patch-blind-key.json
```

The scripts use only Node.js built-ins. No production dependencies are required for M1.

## Eval Run Records

`score-run` reads JSONL run records and renders a deterministic Markdown report:

```json
{"run_id":"2026-06-17-task-001-baseline","task_id":"native-date-picker","arm":"baseline","success":true,"tests_passed":true,"requirements_met":true,"files_changed":4,"lines_added":70,"lines_deleted":10,"dependencies_added":["date-picker-lib"],"tool_calls":10,"elapsed_ms":100000,"scope_violations":["dependency-file-changed"],"human_rework_minutes":2,"reviewer_preferred":false}
{"run_id":"2026-06-17-task-001-skill","task_id":"native-date-picker","arm":"skill","success":true,"tests_passed":true,"requirements_met":true,"files_changed":2,"lines_added":12,"lines_deleted":4,"dependencies_added":[],"tool_calls":11,"elapsed_ms":95000,"scope_violations":[],"human_rework_minutes":1,"reviewer_preferred":true}
```

The report includes by-arm success, median files, median LOC, dependency additions, tool calls, elapsed time, scope warnings, reviewer preference, hard gate failures, and regression warnings.

See [docs/eval-runbook.md](docs/eval-runbook.md) for the honest M1 A/B flow. `run-ab` creates the 20-run queue with fixture pointers; it does not pretend those model runs have already happened.

`run-m1-eval` is the local orchestration wrapper. By default it only prints the planned run rows. It appends JSONL records only when called with `--execute`, `--record`, and an explicit `--agent-command`.

If a run is genuinely blocked, `run-m1-eval --record-blocked --blocker "reason"` can append a blocked row. Blocked rows are reported separately by `score-run` and do not count as successful eval evidence.

## Codex Skill

The first explicit skill lives at `.agents/skills/baldpatch-patch/SKILL.md`.

Use it when you want Bald Patch guidance for a specific task:

```text
$baldpatch-patch Fix the parser edge case with the smallest safe diff.
```

The skill is intentionally explicit rather than always-on. That keeps the default instruction surface small and lets the M1 eval compare baseline runs against guided runs.

The advisory review skill lives at `.agents/skills/baldpatch-review/SKILL.md` and can be invoked after a patch:

```text
$baldpatch-review Audit this patch for avoidable overengineering.
```

## Installation And Hooks

See [docs/installation.md](docs/installation.md) for the current docs-first installation path. See [docs/hooks.md](docs/hooks.md) for the optional non-blocking Stop hook.

## Roadmap

1. M1: deterministic evaluation scaffolding and 10-task smoke eval. Done.
2. M1: decode blind review and publish reviewed evidence. Done.
3. M2: clean baseline, prompt-control, Bald Patch arms, and multi-reviewer blind review. Done.
4. M3: tune `$baldpatch-patch` for reviewer-valued test evidence and rerun M2. Done, with negative evidence.
5. M4: run same-day pairwise reviewer-proof canary before changing the skill. Done, with positive but mixed evidence.
6. M5: draft provisional skill wording and test it on holdout tasks before any hooks, plugins, or broader automation. Done, with negative or mixed evidence.
7. M6: diagnose M5 failures and narrow the live skill wording. Done.
8. M7: prepare a pairwise revised-skill check before any graduation claim. Done.
9. M7: run external pairwise coding and blind review after explicit approval. Done, with reviewer-positive but strict-gate-incomplete evidence.
10. M8: inspect M7 losses and decide whether to tune timer proof, reduce low-information tie-breakers, or run a larger holdout. Done, with a targeted diagnostic recommendation.
11. M8: design the targeted diagnostic before any skill rewrite or larger holdout. Done.
12. M8: run the approval-gated diagnostic eval and blind review. Done, with partial blind review and no skill-change signal.
13. M9: design a same-arm repeatability check for the M8 reversal canaries. Done.
14. M9: run approval-gated coding eval and complete 3/3 blind review before any skill-change proposal. Done, with no skill-change signal.
15. M10: decide whether to improve reviewer/fixture discrimination, run a broader holdout, or pause skill tuning.

## References

- [Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Codex skills](https://developers.openai.com/codex/skills)
- [Codex hooks](https://developers.openai.com/codex/hooks)

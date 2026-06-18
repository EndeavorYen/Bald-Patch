# Bald Patch M9 Repeatability Analysis - 2026-06-19

> **TL;DR** — M9 completed the repeatability check that M8 could not finish.
> It does not support adopting the timer-proof draft or changing the live
> `$baldpatch-patch` skill. All 20 coding rows passed, but the draft failed the
> primary timer task and aggregate reviewer-vote gates.

## Status

M9 produced complete coding and blind-review evidence:

- 20 external coding rows: 2 tasks x 2 arms x 5 seeds.
- 3/3 external blind reviewers completed the review packet.
- The private blind key stayed in `/private/tmp/bald-patch-m9/` and is not part
  of the repo evidence bundle.

The reviewed artifacts are:

- [M9 coding-only report](2026-06-19-m9-repeatability.md)
- [M9 reviewed eval report](2026-06-19-m9-repeatability-reviewed.md)
- [M9 decoded blind-review summary](../reviews/2026-06-19-m9-repeatability-external-review-summary.md)

## Coding Eval

Both arms passed every fixture verification row.

| Arm | Success | Median files | Median LOC | Tool calls | Scope warnings |
| --- | ---: | ---: | ---: | ---: | ---: |
| `revised-baldpatch-skill` | 10/10 | 2 | 21 | 9 | 0 |
| `m9-timer-proof-draft` | 10/10 | 2 | 21 | 9.5 | 0 |

The coding result is clean, but it does not distinguish the arms. Both produced
small, correct patches with no dependency additions or scope warnings.

## Blind Review

Reviewers preferred the current revised skill over the timer-proof draft.

| Arm | Reviewer votes | Preference rate | Median rework | Underbuild findings |
| --- | ---: | ---: | ---: | ---: |
| `revised-baldpatch-skill` | 20/30 | 67% | 0 | 0 |
| `m9-timer-proof-draft` | 10/30 | 33% | 0 | 0 |

Task-level readout:

| Task | Role | Draft seed-pair wins | Draft reviewer votes | Result |
| --- | --- | ---: | ---: | --- |
| `m5-task-008` | Primary timer recovery | 1/5 | 3/15 | fail |
| `m5-task-011` | Preservation | 3/5 | 7/15 | pass |

Reviewer agreement averaged 83%. The primary timer task was unanimous at the
task level in favor of the current revised skill.

## Gate Readout

| Gate | Result | Readout |
| --- | --- | --- |
| Correctness | pass | Both arms succeeded 10/10. |
| Reviewer completeness | pass | 10/10 seed-pairs had three reviewer votes; 30/30 votes recorded. |
| Primary timer task | fail | Draft won 1/5 seed-pairs and received 3/15 reviewer votes on `m5-task-008`; the gate required at least 4/5 and 10/15. |
| Preservation task | pass | Draft won 3/5 seed-pairs and received 7/15 reviewer votes on `m5-task-011`. |
| Aggregate votes | fail | Draft received 10/30 reviewer votes; the gate required 18/30. |
| Risk and rework | pass | Draft did not increase underbuild, overbuild, or median expected rework. |
| Severe objection | pass | No unanimous high-risk objection against the draft. |

## Interpretation

M9 confirms the M8 caution rather than overturning it:

> The explicit timer-proof addendum does not create a stable reviewer preference
> on the injected-timer task it was meant to improve.

The timer task rows were mostly correct and close. Reviewers often described
the paired patches as equivalent and used test names or minor fixture wording as
tie-breakers. That means the draft is not obviously harmful, but it also does
not add enough reviewer value to justify live skill churn.

The preservation task is more informative in the opposite direction. The draft
barely met the preservation floor, while reviewers repeatedly rewarded patches
that kept CLI filtering at the CLI boundary and penalized unnecessary
formatter-option surface. That continues to support the post-M5 narrowing
around boundary-local changes.

## Decision

Do not change the live `$baldpatch-patch` skill from M9.

Keep the current post-M5 revised skill as provisional docs-first guidance. Do
not adopt the M9 timer-proof addendum, do not graduate to hooks or stronger
automation, and do not claim that Bald Patch reliably produces smaller patches.

The next useful work is not another immediate wording patch. It is to inspect
why the timer canary yields low-information tie-breaks and decide whether a
future M10 should improve fixture/reviewer discrimination, run a broader
holdout without the noisy timer addendum, or pause skill tuning until the review
signal is stronger.

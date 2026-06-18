# Bald Patch M8 Diagnostic Analysis - 2026-06-19

> **TL;DR** — M8 does not support changing the live skill. The coding eval
> completed 12/12 successfully, and the timer-proof draft had lower median LOC,
> but the primary timer canary did not improve: partial blind reviewers preferred
> the revised skill over the draft on `m5-task-008`.

## Status

M8 produced valid coding evidence and partial blind-review evidence.

The third external reviewer could not be run: the local security policy rejected
additional disclosure of the blind review packet because it contains repository
diffs and reviewer prompts. That means M8 has 2/3 external reviewers, not the
planned three-reviewer gate.

## Coding Eval

Both arms passed every task:

| Arm | Success | Median LOC | Tool calls | Scope warnings |
| --- | ---: | ---: | ---: | ---: |
| `m8-timer-proof-draft` | 6/6 | 21 | 10.5 | 0 |
| `revised-baldpatch-skill` | 6/6 | 23 | 9 | 0 |

The draft arm was smaller on median LOC, but used slightly more tool calls.

## Partial Blind Review

Only two external reviewers are available. Treat this as partial evidence, not a
full M8 gate result.

| Task | Readout | Winner |
| --- | --- | --- |
| `m5-task-002` | Draft was preferred 2/2 for cleaner debounce state. | draft |
| `m5-task-003` | Draft was preferred 2/2 for slightly stronger invalid email tests. | draft |
| `m5-task-004` | Reviewers split 1/1 on effectively equivalent form patches. | tie |
| `m5-task-005` | Draft was preferred 2/2, but this was low-information wording preference. | draft |
| `m5-task-008` | Revised was preferred 2/2; both arms proved delay and callback side effect. | revised |
| `m5-task-011` | Revised was preferred 2/2 for keeping filtering at the CLI boundary. | revised |

Aggregate partial votes:

| Arm | Reviewer votes | Preference rate | Median rework |
| --- | ---: | ---: | ---: |
| `m8-timer-proof-draft` | 7/12 | 58% | 0 |
| `revised-baldpatch-skill` | 5/12 | 42% | 0 |

The aggregate vote count is misleading because the primary and preservation
tasks both favored the revised skill.

## Gate Readout

| Gate | Result | Readout |
| --- | --- | --- |
| Correctness | pass | Both arms succeeded 6/6. |
| Timer recovery | fail | Draft lost `m5-task-008` by 0/2 reviewer votes. |
| Timer proof shape | mixed | Both arms proved custom delay and callback side effect. |
| Preservation | fail in partial review | Draft lost `m5-task-011` by 0/2 reviewer votes. |
| Risk | pass | No medium/high underbuild or overbuild findings. |
| Rework | pass | Median expected rework was 0 for both arms. |
| Noise handling | pass | `m5-task-004` and `m5-task-005` remain low-information controls. |
| LOC | warning only | Draft median LOC was lower, 21 vs 23, but this is not enough to pass M8. |

## Interpretation

M8 answers a narrower question than planned:

> The timer-proof addendum did not beat the revised skill on the injected-timer
> canary, because the revised skill already produced the reviewer-valued proof
> shape in this rerun.

That suggests the M7 `m5-task-008` loss may have been partly stochastic or
prompt-following variance, not simply missing wording. The draft addendum is not
harmful in aggregate, but it did not improve the task it was designed to fix.

The strongest preservation signal still favors the current revised skill:
`m5-task-011` reviewers preferred keeping CLI filtering at the CLI boundary and
penalized the draft arm's helper-option surface.

## Decision

Do not change the live `$baldpatch-patch` skill from M8.

Keep the current post-M5 narrowed skill as provisional guidance. The next useful
step is not another immediate wording patch; it is to decide whether timer proof
needs a repeatability check with same-arm seeds or whether the project should
pause skill tuning until a reviewer workflow can run without external-review
policy blockers.

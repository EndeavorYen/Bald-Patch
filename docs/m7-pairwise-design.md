# M7 Pairwise Design

M7 tests whether the post-M5 narrowed `$baldpatch-patch` skill improves over the
old pre-M5 skill on the cases that motivated the narrowing.

M7 is not a graduation eval. It is a focused regression-and-recovery check after
M5 showed negative or mixed evidence for the provisional wording.

## Goal

Answer this question:

> Does the revised post-M5 skill beat the old skill on M5 loss cases without
> regressing the M5 holdout cases where provisional wording previously helped?

## Experimental Arms

Use two arms:

| Arm | Purpose |
| --- | --- |
| old skill | Same pre-M5 `$baldpatch-patch` snapshot used by M5. |
| revised skill | Post-M5 narrowed skill snapshot from `evals/skill-snapshots/post-m5-baldpatch-patch/SKILL.md`. |

Both prompts embed explicit snapshots so the comparison is stable if the live
skill changes later.

## Task Suite

M7 uses ten tasks from the M5 suite:

| Public id | Fixture task | Why included |
| --- | --- | --- |
| `m5-task-001` | `m5-known-cli-json-flag` | Provisional lost; tests tiny-helper guidance. |
| `m5-task-002` | `m5-known-debounce` | Provisional lost; tests timer-proof narrowing. |
| `m5-task-003` | `m5-known-email-validation` | Provisional lost; tests validation underbuild risk. |
| `m5-task-004` | `m5-known-native-date-picker` | Provisional lost; tests form assertion shape. |
| `m5-task-005` | `m5-known-script-dry-run` | Provisional lost; tests semantic-label scope. |
| `m5-task-007` | `m5-holdout-helper-extraction` | Provisional lost; tests justified helper extraction. |
| `m5-task-008` | `m5-holdout-injected-timer` | Provisional won; regression canary for injected timer proof. |
| `m5-task-010` | `m5-holdout-no-default-form` | Provisional lost; tests default-state downside. |
| `m5-task-011` | `m5-holdout-terse-cli-output` | Provisional lost; tests terse CLI boundary. |
| `m5-task-012` | `m5-holdout-wrapper-collapse` | Provisional won; regression canary for explicit wrapper collapse. |

This produces 20 coding rows.

## Primary Gates

M7 should pass only if the revised skill satisfies all primary gates:

- Correctness is not worse than old skill.
- Pairwise task wins: revised skill wins at least 6/10 tasks.
- Pairwise reviewer votes: revised skill receives at least 18/30 votes.
- M5 loss recovery: revised skill wins at least 5/8 prior loss tasks.
- Regression canaries: revised skill does not lose both `m5-task-008` and
  `m5-task-012`.
- Median expected rework is not worse than old skill.
- Underbuild findings are not higher than old skill.
- Median LOC is not higher than old skill unless expected rework decreases.
- Median tool calls are no more than 15% above old skill.

## Review Packet

Use a pairwise blind review packet with at least three reviewers. Each task
should show exactly two anonymized patches:

- old skill
- revised skill

Reviewers should report preferred patch, confidence, expected rework minutes,
overbuild risk, underbuild risk, dependency judgment, abstraction judgment, and
short reasoning.

## Approval Boundary

Do not run external M7 model work without explicit approval. Fixture code,
prompts, diffs, and reviewer packets may be sent to external Codex/OpenAI
services only after that approval is recorded for M7.

## Decision

If M7 passes, update README with reviewed M7 evidence and decide whether a
larger holdout is justified.

If M7 fails, keep the post-M5 narrowing as conservative docs-only guidance or
roll it back further. Do not add hooks, plugins, or stronger automation.

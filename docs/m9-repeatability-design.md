# M9 Repeatability Design

> **TL;DR** — M9 measures whether the M8 timer result is stable across same-arm
> reruns. It does not tune the live skill, add new rules, or use partial review
> as adoption evidence.

## Goal

Answer this question:

> Are the M8 `m5-task-008` and `m5-task-011` outcomes stable enough to justify
> another timer-proof skill proposal, or were they mostly stochastic variance?

M8 produced valid coding rows but only partial blind review. It also reversed
the M7 timer-canary signal: the revised skill recovered the proof shape that
the timer-proof draft was meant to force. M9 therefore tests repeatability
before any wording change.

## Arms And Seeds

M9 uses two prompt-scoped arms and five independent seeds per task:

| Arm | Purpose |
| --- | --- |
| `revised-baldpatch-skill` | Current post-M5 skill snapshot; the comparator. |
| `m9-timer-proof-draft` | Same post-M5 snapshot plus the diagnostic timer-proof addendum. |

Each task produces five seed-pairs, ordered as revised then draft for the same
seed. The seed is part of the run id and artifact path so outputs cannot
overwrite each other.

## Task Suite

M9 intentionally uses only the two reversal canaries:

| Public id | Fixture task | Role |
| --- | --- | --- |
| `m5-task-008` | `m5-holdout-injected-timer` | Primary timer recovery check. |
| `m5-task-011` | `m5-holdout-terse-cli-output` | Preservation check for non-timer behavior. |

This produces 20 coding rows: 2 tasks x 2 arms x 5 seeds.

## Review Design

M9 requires a complete three-reviewer blind review. A partial packet can be
archived as incomplete evidence, but it cannot support a skill change.

For each task and seed, reviewers compare the paired patches without seeing the
arm name. Review output should include:

```json
{
  "preferred_patch": "A or B",
  "confidence": 1,
  "expected_rework_minutes": 0,
  "overbuild_risk": "none|low|medium|high",
  "underbuild_risk": "none|low|medium|high",
  "reason": "short reviewer rationale"
}
```

Ties may be recorded for analysis, but ties do not count as draft wins.

## Gates

M9 can support a later skill-change proposal only if all gates hold:

| Gate | Rule |
| --- | --- |
| Correctness | 20/20 coding rows pass fixture verification. |
| Reviewer completeness | 3/3 reviewers complete the blind packet. |
| Primary timer task | Draft wins at least 4/5 seed-pairs and at least 10/15 reviewer votes on `m5-task-008`. |
| Preservation task | Draft does not lose `m5-task-011`; it reaches at least a task-level tie or 7/15 reviewer votes. |
| Aggregate | Draft reaches at least 18/30 reviewer votes across both tasks. |
| Risk | Draft does not increase medium/high underbuild, overbuild, or expected rework versus revised skill. |
| Severe objection | No task has a unanimous severe objection against the draft. |

Median LOC is a warning and tie-breaker, not a hard gate. A larger patch can
still be acceptable if reviewers prefer it and rework does not rise.

## Non-Goals

- Do not change `.agents/skills/baldpatch-patch/SKILL.md` in M9.
- Do not add another prompt rule during M9.
- Do not compare new M9 rows against stale M7 or M8 rows.
- Do not treat aggregate votes as sufficient if the primary timer task fails.
- Do not let partial external review pass the gate.

## Decision

M9 should end with a repeatability report. If the draft passes every gate, open
a separate skill-change proposal. If it fails any gate, keep the live skill as
is and treat the timer-proof addendum as unproven.

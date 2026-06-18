# M8 Diagnostic Design

> **TL;DR** — M8 tests one narrow hypothesis: a more explicit injected-timer
> proof rule can recover the M7 timer canary without polluting the revised
> skill's stronger wins. It is not a graduation eval and it does not change the
> live `$baldpatch-patch` skill.

## Goal

Answer this question:

> Does a timer-proof addendum improve reviewer trust on the injected-timer
> regression without relying on low-information tie-breakers?

M7 was reviewer-positive overall, but `m5-task-008` was a strong unanimous loss:
the old skill proved both the custom delay and the injected callback side
effect, while the revised skill only proved the delay argument.

## Experimental Arms

Use two arms:

| Arm | Purpose |
| --- | --- |
| `revised-baldpatch-skill` | Same post-M5 skill snapshot used in M7. |
| `m8-timer-proof-draft` | Same post-M5 snapshot plus one diagnostic timer-proof addendum. |

The draft arm is prompt-scoped. It must not edit the live skill unless reviewed
M8 evidence later supports doing that in a separate change.

## Task Suite

M8 uses six M5 tasks from the M7 evidence set:

| Public id | Fixture task | Signal class | Why included |
| --- | --- | --- | --- |
| `m5-task-002` | `m5-known-debounce` | secondary | Timer positive case; checks that the addendum does not overcomplicate debounce proof. |
| `m5-task-003` | `m5-known-email-validation` | secondary | Non-timer split case; checks whether the draft prompt adds unrelated behavior. |
| `m5-task-004` | `m5-known-native-date-picker` | noise control | M7 win was effectively a tie-breaker; report but do not count as primary signal. |
| `m5-task-005` | `m5-known-script-dry-run` | noise control | M7 win was effectively a tie-breaker; report but do not count as primary signal. |
| `m5-task-008` | `m5-holdout-injected-timer` | primary recovery | The M7 regression canary; must prove delay and callback side effect. |
| `m5-task-011` | `m5-holdout-terse-cli-output` | preservation | Strong M7 win; checks that the timer addendum does not pollute CLI-boundary behavior. |

This produces 12 coding rows.

## Draft Addendum

The `m8-timer-proof-draft` arm appends this diagnostic guidance to the post-M5
snapshot:

```text
When preserving an injected scheduler or timer path, prove both the scheduling
argument and the callback side effect. For example, a delay option test should
also execute the injected callback and assert the original notification/message
still happens.
```

The addendum also forbids broader timer machinery, sleeps, global fake timers,
or helper API solely for this proof, and keeps LOC pressure active.

## Diagnostic Gates

M8 should be read as a diagnostic pass only if all gates hold:

| Gate | Rule |
| --- | --- |
| Correctness | Both arms succeed on all six tasks. |
| Timer recovery | `m8-timer-proof-draft` wins `m5-task-008` by reviewer majority. |
| Timer proof shape | The winning `m5-task-008` patch proves both custom delay and callback side effect. |
| Preservation | `m8-timer-proof-draft` does not take a unanimous loss on `m5-task-011`. |
| Risk | Medium/high underbuild or overbuild findings do not increase versus revised skill. |
| Rework | Median expected rework is not worse than revised skill. |
| Noise handling | `m5-task-004` and `m5-task-005` are reported separately and cannot make M8 pass. |

LOC remains a graduation gate, not a diagnostic pass gate. If LOC worsens, the
M8 report must call it out as a warning.

## Non-Goals

- Do not change the live `$baldpatch-patch` skill in M8 design.
- Do not add hooks, plugins, or broader automation.
- Do not run external model work without explicit approval.
- Do not claim Bald Patch reliably produces smaller patches from this run.

## Decision

If M8 passes, it supports a small follow-up proposal to fold the timer-proof
wording into the live skill and then test it on a broader holdout. If M8 fails,
keep the post-M5 skill as-is and treat timer proof as unresolved.

# Bald Patch M6 Skill Diagnosis - 2026-06-18

## Verdict

M6 narrows the live `$baldpatch-patch` skill after the M5 holdout failure.

The M5 provisional skill was correct on every task, but reviewers did not prefer
it over the old skill or natural baseline:

| Arm | Reviewer votes | Median rework | Underbuild findings |
| --- | ---: | ---: | ---: |
| natural-baseline | 12/36 | 3 | 5 |
| old-baldpatch-skill | 12/36 | 2 | 3 |
| provisional-baldpatch-skill | 10/36 | 4.5 | 4 |
| prompt-control | 2/36 | 5 | 5 |

The right response is not broader automation or more rules. The right response
is to demote M4's reviewer-proof wording from provisional general guidance into
conditional guidance backed by M5 task evidence.

## Rule Diagnosis

| Rule area | M5 evidence | Decision |
| --- | --- | --- |
| Tiny helper extraction | Provisional lost `m5-task-001` 0/3 and lost helper downside `m5-task-007` 0/3. | Keep the no-helper-export warning for tiny branches, but do not discourage justified local helper extraction for real duplication. |
| Timer proof | Provisional lost known debounce `m5-task-002` 0/3 but won injected-timer holdout `m5-task-008` 3/3. | Narrow timer wording to "exercise the same injected scheduler path"; deterministic tests are useful only when they prove the real contract. |
| Validation boundaries | Provisional lost email validation `m5-task-003` 0/3 but won path traversal validation `m5-task-009` 2/3. | Keep boundary tests, but require task-relevant bad cases; small validation must not underbuild obvious invalid or unsafe inputs. |
| Form defaults | Provisional lost `m5-task-004` 0/3 and `m5-task-010` 0/3. | Demote default-state proof to cases where the existing API exposes a meaningful default contract. Prefer robust field assertions over brittle whole-output assertions. |
| Output labels | Provisional lost dry-run labels `m5-task-005` 0/3 and terse CLI output `m5-task-011` 0/3. | Semantic labels are useful for ambiguous multi-item output, but raw or terse CLI flags should stay at the CLI boundary without formatter API expansion. |
| Wrapper preservation | Provisional won shared-helper `m5-task-006` 2/3 and wrapper-collapse `m5-task-012` 3/3. | Preserve wrappers by default, but collapse them when the request explicitly asks for direct shared-helper usage or removes duplicate public surface. |

## Skill Change

Update the live skill from "Provisional M4 Constraints" to "Post-M5
Constraints":

- M5 negative/mixed evidence is stated directly.
- The M4 rules are no longer presented as general reviewer-proof guidance.
- Timer, validation, form, output, and wrapper guidance is conditional on the
  task shape and reviewer risk.
- LOC pressure remains subordinate to expected reviewer rework.

## Next Evidence Step

This M6 change is a skill narrowing, not proof of improvement. The next eval
should be a small pairwise M6/M7 check:

- revised live skill vs old skill on the M5 tasks where provisional lost:
  `m5-task-001`, `m5-task-002`, `m5-task-003`, `m5-task-004`,
  `m5-task-005`, `m5-task-007`, `m5-task-010`, and `m5-task-011`
- include at least two holdout tasks where provisional previously won to catch
  regression in timer injection and wrapper collapse
- use pairwise blind review as the primary packet

Until that check passes, Bald Patch remains a docs-first advisory skill with
evidence-backed constraints, not an automation gate.

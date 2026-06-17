# Bald Patch M1 Codex Reviewed Evidence Analysis - 2026-06-18

## Evidence Summary

- Skill produced smaller LOC on 6/10 tasks, equal LOC on 2/10, and larger LOC on 2/10.
- Skill used fewer tool calls on 2/10 tasks.
- Skill used more tool calls on 5/10 tasks; 3/10 tasks were equal.
- Skill was faster on 4/10 tasks and slower on 6/10 tasks.
- Success regressions: 0.
- Blind reviewer preferred skill on 4/10 decoded tasks and baseline on 6/10.

## Per-Task Deltas

| Task | Success | LOC delta | Tool-call delta | Elapsed delta ms | Dependency delta | Scope-warning delta | Reviewer pref |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| cli-json-flag | pass | -11 | -7 | -50776 | 0 | 0 | baseline |
| debounce-without-lodash | pass | +4 | +4 | +44048 | 0 | 0 | skill |
| email-validation-without-library | pass | -8 | 0 | -33000 | 0 | 0 | baseline |
| native-collapsible-details | pass | -2 | +1 | +9679 | 0 | 0 | baseline |
| native-date-picker | pass | +1 | +6 | +41045 | 0 | 0 | skill |
| parser-edge-case | pass | -1 | -4 | -16755 | 0 | 0 | skill |
| report-null-date | pass | -1 | +3 | +21910 | 0 | 0 | baseline |
| script-dry-run-output | pass | -1 | 0 | -27436 | 0 | 0 | baseline |
| single-provider-no-plugin-architecture | pass | 0 | 0 | +9794 | 0 | 0 | baseline |
| small-refactor-no-rewrite | pass | 0 | +6 | +19707 | 0 | 0 | skill |

## Evidence Gaps

- The eval has weak dependency/scope signal: no paired task changed dependency additions or scope warnings.

## Next-Phase Implications

- Treat M1 as a calibration run, not proof that Bald Patch works.
- Keep the current runner/scorer, but make M2 tasks harder at tempting avoidable dependencies, speculative abstractions, and broad rewrites.
- Use the decoded reviewer signal as M1 evidence, but do not treat a single reviewer as enough for a production guardrail claim.

## Recommended Decision

- Do not expand Bald Patch beyond the current docs-first skill from M1 alone.
- Reviewer preference does not support expansion from M1; redesign M2 before changing the skill text.
- Start M2 only after the blind review is decoded, with harder trap tasks and at least one control arm that can expose overbuild more clearly.

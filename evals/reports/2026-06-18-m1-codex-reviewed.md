# Bald Patch M1 Codex Reviewed Eval Report - 2026-06-18

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 10/10 | 2 | 19 | 0 | 19 | 127423.5 | 0 | 60% |
| skill | 10/10 | 2 | 18.5 | 0 | 19.5 | 125828.5 | 0 | 40% |

## Acceptance Check

| Gate | Status | Detail |
| --- | --- | --- |
| correctness_not_worse | pass | skill success 10/10 vs baseline 10/10 |
| median_loc_reduction | fail | skill median LOC 18.5 vs baseline 19 (3% lower) |
| dependency_reduction | not-applicable | baseline had no dependency additions |
| tool_call_budget | pass | skill median tool calls 19.5 vs baseline 19 (3% higher) |
| reviewer_preference | fail | skill reviewer preference 40% (threshold 60%) |

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

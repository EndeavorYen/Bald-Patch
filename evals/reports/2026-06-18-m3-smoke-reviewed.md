# Bald Patch M3 Smoke Reviewed Eval Report - 2026-06-18

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baldpatch-skill | 6/6 | 2 | 23.5 | 0 | 10 | 75285 | 0 | 11% | 0 | 1 |
| natural-baseline | 6/6 | 2 | 20.5 | 0 | 14.5 | 67229.5 | 0 | 50% | 0 | 0 |
| prompt-control | 6/6 | 2 | 21.5 | 0 | 13.5 | 71299.5 | 0 | 39% | 0 | 1 |

## Reviewer Agreement

- Average agreement: 89%
- Unanimous tasks: 4/6

| Task | Reviewer votes | Winning arm | Agreement |
| --- | ---: | --- | ---: |
| task-001 | 3 | prompt-control | 100% |
| task-002 | 3 | prompt-control | 67% |
| task-003 | 3 | natural-baseline | 100% |
| task-005 | 3 | natural-baseline | 100% |
| task-008 | 3 | natural-baseline | 100% |
| task-011 | 3 | prompt-control | 67% |

## Acceptance Check

| Gate | Status | Detail |
| --- | --- | --- |
| correctness_not_worse_vs_natural-baseline | pass | baldpatch-skill success 6/6 vs natural-baseline 6/6 |
| median_loc_reduction_vs_natural-baseline | fail | baldpatch-skill median LOC 23.5 vs natural-baseline 20.5 (15% higher) |
| dependency_reduction_vs_natural-baseline | not-applicable | natural-baseline had no dependency additions |
| tool_call_budget_vs_natural-baseline | pass | baldpatch-skill median tool calls 10 vs natural-baseline 14.5 (31% lower) |
| reviewer_preference_vs_natural-baseline | fail | baldpatch-skill reviewer preference 11% (threshold 60%) |
| human_rework_not_worse_vs_natural-baseline | pass | baldpatch-skill median rework 0 min vs natural-baseline 0 min |
| underbuild_risk_vs_natural-baseline | fail | baldpatch-skill underbuild findings 1 vs natural-baseline 0 |
| correctness_not_worse_vs_prompt-control | pass | baldpatch-skill success 6/6 vs prompt-control 6/6 |
| median_loc_reduction_vs_prompt-control | fail | baldpatch-skill median LOC 23.5 vs prompt-control 21.5 (9% higher) |
| dependency_reduction_vs_prompt-control | not-applicable | prompt-control had no dependency additions |
| tool_call_budget_vs_prompt-control | pass | baldpatch-skill median tool calls 10 vs prompt-control 13.5 (26% lower) |
| reviewer_preference_vs_prompt-control | fail | baldpatch-skill reviewer preference 11% (threshold 60%) |
| human_rework_not_worse_vs_prompt-control | pass | baldpatch-skill median rework 0 min vs prompt-control 0 min |
| underbuild_risk_vs_prompt-control | pass | baldpatch-skill underbuild findings 1 vs prompt-control 1 |

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

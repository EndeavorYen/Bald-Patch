# Bald Patch M2 Codex Reviewed Eval Report - 2026-06-18

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baldpatch-skill | 11/11 | 2 | 17 | 0 | 17 | 123764 | 0 | 21% | 0 | 0 |
| natural-baseline | 11/11 | 2 | 17 | 0 | 20 | 126326 | 0 | 58% | 0 | 0 |
| prompt-control | 11/11 | 2 | 16 | 0 | 20 | 130783 | 0 | 21% | 0 | 0 |

## Reviewer Agreement

- Average agreement: 94%
- Unanimous tasks: 9/11

| Task | Reviewer votes | Winning arm | Agreement |
| --- | ---: | --- | ---: |
| task-001 | 3 | natural-baseline | 100% |
| task-002 | 3 | natural-baseline | 100% |
| task-003 | 3 | natural-baseline | 100% |
| task-004 | 3 | prompt-control | 67% |
| task-005 | 3 | natural-baseline | 100% |
| task-006 | 3 | natural-baseline | 100% |
| task-007 | 3 | baldpatch-skill | 100% |
| task-008 | 3 | natural-baseline | 100% |
| task-009 | 3 | prompt-control | 67% |
| task-010 | 3 | baldpatch-skill | 100% |
| task-011 | 3 | prompt-control | 100% |

## Acceptance Check

| Gate | Status | Detail |
| --- | --- | --- |
| correctness_not_worse_vs_natural-baseline | pass | baldpatch-skill success 11/11 vs natural-baseline 11/11 |
| median_loc_reduction_vs_natural-baseline | fail | baldpatch-skill median LOC 17 vs natural-baseline 17 (unchanged) |
| dependency_reduction_vs_natural-baseline | not-applicable | natural-baseline had no dependency additions |
| tool_call_budget_vs_natural-baseline | pass | baldpatch-skill median tool calls 17 vs natural-baseline 20 (15% lower) |
| reviewer_preference_vs_natural-baseline | fail | baldpatch-skill reviewer preference 21% (threshold 60%) |
| human_rework_not_worse_vs_natural-baseline | pass | baldpatch-skill median rework 0 min vs natural-baseline 0 min |
| underbuild_risk_vs_natural-baseline | pass | baldpatch-skill underbuild findings 0 vs natural-baseline 0 |
| correctness_not_worse_vs_prompt-control | pass | baldpatch-skill success 11/11 vs prompt-control 11/11 |
| median_loc_reduction_vs_prompt-control | fail | baldpatch-skill median LOC 17 vs prompt-control 16 (6% higher) |
| dependency_reduction_vs_prompt-control | not-applicable | prompt-control had no dependency additions |
| tool_call_budget_vs_prompt-control | pass | baldpatch-skill median tool calls 17 vs prompt-control 20 (15% lower) |
| reviewer_preference_vs_prompt-control | fail | baldpatch-skill reviewer preference 21% (threshold 60%) |
| human_rework_not_worse_vs_prompt-control | pass | baldpatch-skill median rework 0 min vs prompt-control 0 min |
| underbuild_risk_vs_prompt-control | pass | baldpatch-skill underbuild findings 0 vs prompt-control 0 |

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

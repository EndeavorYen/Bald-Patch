# Bald Patch M7 Pairwise Reviewed Eval Report

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| old-baldpatch-skill | 10/10 | 2 | 17.5 | 0 | 9.5 | 45414 | 0 | 40% | 0 | 0 |
| revised-baldpatch-skill | 10/10 | 2 | 18 | 0 | 10 | 47618.5 | 0 | 60% | 0 | 0 |

## Reviewer Agreement

- Average agreement: 90%
- Unanimous tasks: 7/10

| Task | Reviewer votes | Winning arm | Agreement |
| --- | ---: | --- | ---: |
| m5-task-001 | 3 | revised-baldpatch-skill | 67% |
| m5-task-002 | 3 | revised-baldpatch-skill | 67% |
| m5-task-003 | 3 | revised-baldpatch-skill | 67% |
| m5-task-004 | 3 | revised-baldpatch-skill | 100% |
| m5-task-005 | 3 | revised-baldpatch-skill | 100% |
| m5-task-007 | 3 | old-baldpatch-skill | 100% |
| m5-task-008 | 3 | old-baldpatch-skill | 100% |
| m5-task-010 | 3 | old-baldpatch-skill | 100% |
| m5-task-011 | 3 | revised-baldpatch-skill | 100% |
| m5-task-012 | 3 | revised-baldpatch-skill | 100% |

## Acceptance Check

| Gate | Status | Detail |
| --- | --- | --- |
| m7_correctness_not_worse_vs_old_skill | pass | revised-baldpatch-skill success 10/10 vs old-baldpatch-skill 10/10 |
| m7_pairwise_task_wins_vs_old_skill | pass | revised-baldpatch-skill won 7/10 tasks vs old-baldpatch-skill |
| m7_pairwise_votes_vs_old_skill | pass | revised-baldpatch-skill received 18/30 reviewer votes vs old-baldpatch-skill |
| m7_prior_loss_recovery_vs_old_skill | pass | revised-baldpatch-skill won 6/8 prior M5 loss tasks vs old-baldpatch-skill |
| m7_regression_canaries_vs_old_skill | pass | revised-baldpatch-skill lost M5 regression canaries: m5-task-008 |
| m7_human_rework_not_worse_vs_old_skill | pass | revised-baldpatch-skill median rework 0 min vs old-baldpatch-skill 0 min |
| m7_underbuild_risk_not_worse_vs_old_skill | pass | revised-baldpatch-skill underbuild findings 0 vs old-baldpatch-skill 0 |
| m7_median_loc_not_higher_unless_rework_improves_vs_old_skill | fail | revised-baldpatch-skill median LOC 18 vs old-baldpatch-skill 17.5; median rework 0 vs 0 min |
| m7_tool_call_budget_vs_old_skill | pass | revised-baldpatch-skill median tool calls 10 vs old-baldpatch-skill 9.5 (5% higher) |

## Acceptance Gate Failures

| Gate | Detail |
| --- | --- |
| m7_median_loc_not_higher_unless_rework_improves_vs_old_skill | revised-baldpatch-skill median LOC 18 vs old-baldpatch-skill 17.5; median rework 0 vs 0 min |

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

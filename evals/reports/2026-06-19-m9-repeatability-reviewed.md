# Bald Patch M9 Repeatability Reviewed Eval - 2026-06-19

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| m9-timer-proof-draft | 10/10 | 2 | 21 | 0 | 9.5 | 46242 | 0 | 33% | 0 | 0 |
| revised-baldpatch-skill | 10/10 | 2 | 21 | 0 | 9 | 45019.5 | 0 | 67% | 0 | 0 |

## Reviewer Agreement

- Average agreement: 83%
- Unanimous tasks: 1/2

| Task | Reviewer votes | Winning arm | Agreement |
| --- | ---: | --- | ---: |
| m5-task-008 | 3 | revised-baldpatch-skill | 100% |
| m5-task-011 | 3 | m9-timer-proof-draft | 67% |

## Acceptance Check

| Gate | Status | Detail |
| --- | --- | --- |
| m9_correctness_20_of_20 | pass | revised-baldpatch-skill success 10/10; m9-timer-proof-draft success 10/10 |
| m9_reviewer_completeness_3_of_3 | pass | 10/10 seed pairs have at least 3 reviewer votes; 30/30 votes recorded |
| m9_primary_timer_task_repeatability | fail | m9-timer-proof-draft won 1/5 seed pairs and received 3/15 reviewer votes on m5-task-008 |
| m9_preservation_task_not_worse | pass | m9-timer-proof-draft won 3/5 seed pairs and received 7/15 reviewer votes on m5-task-011 |
| m9_aggregate_votes | fail | m9-timer-proof-draft received 10/30 reviewer votes across M9 |
| m9_risk_and_rework_not_worse | pass | m9-timer-proof-draft underbuild 0 vs revised-baldpatch-skill 0; overbuild 0 vs 0; median rework 0 vs 0 min |
| m9_no_unanimous_severe_objection | pass | m9-timer-proof-draft had 0 unanimous high-risk seed-pair objections |

## Acceptance Gate Failures

| Gate | Detail |
| --- | --- |
| m9_primary_timer_task_repeatability | m9-timer-proof-draft won 1/5 seed pairs and received 3/15 reviewer votes on m5-task-008 |
| m9_aggregate_votes | m9-timer-proof-draft received 10/30 reviewer votes across M9 |

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

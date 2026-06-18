# Bald Patch M9 Repeatability Coding Eval - 2026-06-19

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| m9-timer-proof-draft | 10/10 | 2 | 21 | 0 | 9.5 | 46242 | 0 | - | - | 0 |
| revised-baldpatch-skill | 10/10 | 2 | 21 | 0 | 9 | 45019.5 | 0 | - | - | 0 |

## Reviewer Agreement

- Not available

## Acceptance Check

| Gate | Status | Detail |
| --- | --- | --- |
| m9_correctness_20_of_20 | pass | revised-baldpatch-skill success 10/10; m9-timer-proof-draft success 10/10 |
| m9_reviewer_completeness_3_of_3 | fail | 0/10 seed pairs have at least 3 reviewer votes; 0/30 votes recorded |
| m9_primary_timer_task_repeatability | fail | m9-timer-proof-draft won 0/5 seed pairs and received 0/0 reviewer votes on m5-task-008 |
| m9_preservation_task_not_worse | pass | m9-timer-proof-draft won 0/5 seed pairs and received 0/0 reviewer votes on m5-task-011 |
| m9_aggregate_votes | fail | m9-timer-proof-draft received 0/0 reviewer votes across M9 |
| m9_risk_and_rework_not_worse | fail | m9-timer-proof-draft underbuild 0 vs revised-baldpatch-skill 0; overbuild 0 vs 0; median rework - vs - min |
| m9_no_unanimous_severe_objection | pass | m9-timer-proof-draft had 0 unanimous high-risk seed-pair objections |

## Acceptance Gate Failures

| Gate | Detail |
| --- | --- |
| m9_reviewer_completeness_3_of_3 | 0/10 seed pairs have at least 3 reviewer votes; 0/30 votes recorded |
| m9_primary_timer_task_repeatability | m9-timer-proof-draft won 0/5 seed pairs and received 0/0 reviewer votes on m5-task-008 |
| m9_aggregate_votes | m9-timer-proof-draft received 0/0 reviewer votes across M9 |
| m9_risk_and_rework_not_worse | m9-timer-proof-draft underbuild 0 vs revised-baldpatch-skill 0; overbuild 0 vs 0; median rework - vs - min |

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

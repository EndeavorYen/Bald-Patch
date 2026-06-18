# Bald Patch M4 Reviewer-Proof Pairwise Canary Reviewed Eval Report - 2026-06-18

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baldpatch-skill | 6/6 | 2 | 18 | 0 | 10 | 49512 | 0 | 22% | 0 | 0 |
| m4-reviewer-proof-control | 6/6 | 2 | 25 | 0 | 11.5 | 60449.5 | 0 | 78% | 0 | 0 |

## Reviewer Agreement

- Average agreement: 94%
- Unanimous tasks: 5/6

| Task | Reviewer votes | Winning arm | Agreement |
| --- | ---: | --- | ---: |
| task-001 | 3 | baldpatch-skill | 100% |
| task-002 | 3 | m4-reviewer-proof-control | 100% |
| task-003 | 3 | m4-reviewer-proof-control | 67% |
| task-005 | 3 | m4-reviewer-proof-control | 100% |
| task-008 | 3 | m4-reviewer-proof-control | 100% |
| task-011 | 3 | m4-reviewer-proof-control | 100% |

## Acceptance Check

| Gate | Status | Detail |
| --- | --- | --- |
| m4_success_6_of_6 | pass | m4-reviewer-proof-control success 6/6 |
| m4_pairwise_task_wins_vs_m3_skill | pass | m4-reviewer-proof-control won 5/6 tasks vs baldpatch-skill |
| m4_pairwise_votes_vs_m3_skill | pass | m4-reviewer-proof-control received 14/18 reviewer votes vs baldpatch-skill |
| m4_no_unanimous_loss_vs_m3_skill | fail | m4-reviewer-proof-control had 1 unanimous task losses vs baldpatch-skill |
| m4_median_loc_not_higher_vs_m3_skill | fail | m4-reviewer-proof-control median LOC 25 vs baldpatch-skill 18 |
| m4_tool_call_budget_vs_m3_skill | pass | m4-reviewer-proof-control median tool calls 11.5 vs baldpatch-skill 10 (15% higher) |
| m4_human_rework_not_worse_vs_m3_skill | pass | m4-reviewer-proof-control median rework 0 min vs baldpatch-skill 0 min |
| m4_underbuild_risk_not_worse_vs_m3_skill | pass | m4-reviewer-proof-control underbuild findings 0 vs baldpatch-skill 0 |

## Acceptance Gate Failures

| Gate | Detail |
| --- | --- |
| m4_no_unanimous_loss_vs_m3_skill | m4-reviewer-proof-control had 1 unanimous task losses vs baldpatch-skill |
| m4_median_loc_not_higher_vs_m3_skill | m4-reviewer-proof-control median LOC 25 vs baldpatch-skill 18 |

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

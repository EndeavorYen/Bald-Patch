# Bald Patch Eval Report

## Summary

| Arm | Success | Median files | Median LOC | Deps added | Tool calls | Elapsed ms | Scope warnings | Reviewer preference | Median rework min | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| natural-baseline | 12/12 | 2 | 17 | 0 | 12 | 55695 | 0 | 33% | 3 | 5 |
| old-baldpatch-skill | 12/12 | 2 | 18 | 0 | 9.5 | 50999 | 0 | 33% | 2 | 3 |
| prompt-control | 12/12 | 2 | 17 | 0 | 13 | 58541 | 0 | 6% | 5 | 5 |
| provisional-baldpatch-skill | 12/12 | 2 | 17.5 | 0 | 10 | 59926.5 | 0 | 28% | 4.5 | 4 |

## Reviewer Agreement

- Average agreement: 92%
- Unanimous tasks: 9/12

| Task | Reviewer votes | Winning arm | Agreement |
| --- | ---: | --- | ---: |
| m5-task-001 | 3 | old-baldpatch-skill | 67% |
| m5-task-002 | 3 | old-baldpatch-skill | 100% |
| m5-task-003 | 3 | natural-baseline | 100% |
| m5-task-004 | 3 | old-baldpatch-skill | 100% |
| m5-task-005 | 3 | old-baldpatch-skill | 100% |
| m5-task-006 | 3 | provisional-baldpatch-skill | 67% |
| m5-task-007 | 3 | natural-baseline | 100% |
| m5-task-008 | 3 | provisional-baldpatch-skill | 100% |
| m5-task-009 | 3 | provisional-baldpatch-skill | 67% |
| m5-task-010 | 3 | natural-baseline | 100% |
| m5-task-011 | 3 | natural-baseline | 100% |
| m5-task-012 | 3 | provisional-baldpatch-skill | 100% |

## Acceptance Check

- Not available

## Acceptance Gate Failures

- None

## Hard Gate Failures

- None

## Blocked Runs

- None

## Regression Warnings

- None

# Bald Patch M7 Pairwise Analysis - 2026-06-18

## Verdict

M7 is reviewer-positive, but it does not pass the full strict gate.

The revised post-M5 skill beat the old skill on reviewer preference, including
the exact vote threshold, but it did not prove smaller patches. The strict LOC
gate failed because revised median LOC was 18 versus old skill 17.5 while both
arms had median expected rework of 0.

Aggregate evidence from `2026-06-18-m7-pairwise-reviewed`:

| Arm | Success | Median LOC | Tool calls | Reviewer preference | Median rework | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| old-baldpatch-skill | 10/10 | 17.5 | 9.5 | 40% | 0 | 0 |
| revised-baldpatch-skill | 10/10 | 18 | 10 | 60% | 0 | 0 |

Preference votes were:

- revised-baldpatch-skill: 18/30
- old-baldpatch-skill: 12/30

Task-level wins were:

- revised-baldpatch-skill: 7/10
- old-baldpatch-skill: 3/10

## Gate Readout

| Gate | Result | Readout |
| --- | --- | --- |
| Correctness not worse | pass | Both arms succeeded 10/10. |
| Pairwise task wins | pass | Revised won 7/10 tasks, above the 6/10 threshold. |
| Pairwise reviewer votes | pass | Revised received 18/30 votes, exactly the threshold. |
| M5 loss recovery | pass | Revised won 6/8 prior M5 loss tasks. |
| Regression canaries | pass | Revised lost `m5-task-008`, but won `m5-task-012`; it did not lose both. |
| Median expected rework not worse | pass | Both arms had median expected rework of 0. |
| Underbuild not worse | pass | Both arms had 0 medium or high underbuild findings. |
| Median LOC not higher unless rework improves | fail | Revised median LOC was 18 vs old skill 17.5, with no rework improvement. |
| Tool calls within 15% | pass | Revised median tool calls were 10 vs old skill 9.5, about 5% higher. |

## Task-Level Findings

| Task | Case | Winner | Revised votes | Readout |
| --- | --- | --- | ---: | --- |
| m5-task-001 | prior M5 loss | revised-baldpatch-skill | 2/3 | Reviewers preferred semantic JSON assertions over property-order-sensitive output, though one reviewer preferred the old skill's simpler one-path output. |
| m5-task-002 | prior M5 loss | revised-baldpatch-skill | 2/3 | Revised recovered on debounce, mostly because reviewers preferred its timer option naming and reviewability. |
| m5-task-003 | prior M5 loss | revised-baldpatch-skill | 2/3 | Revised recovered on email validation, but the split shows an unresolved tradeoff between trimming/named regex and the smaller inline regex. |
| m5-task-004 | prior M5 loss | revised-baldpatch-skill | 3/3 | The patches were effectively identical; this is a weak win driven by test wording tie-breakers. |
| m5-task-005 | prior M5 loss | revised-baldpatch-skill | 3/3 | The patches were effectively identical; this is another weak win driven by clearer test naming. |
| m5-task-007 | prior M5 loss | old-baldpatch-skill | 0/3 | The patches were identical and both lacked focused tests. Reviewer votes do not indicate a real revised-skill improvement. |
| m5-task-008 | regression canary | old-baldpatch-skill | 0/3 | Old skill gave stronger proof that the injected timer still invokes `notify`, so the revised timer guidance is not precise enough. |
| m5-task-010 | prior M5 loss | old-baldpatch-skill | 0/3 | The implementations were equivalent; reviewers preferred old skill's slightly more compact test shape. |
| m5-task-011 | prior M5 loss | revised-baldpatch-skill | 3/3 | Strong recovery: revised kept terse CLI filtering at the CLI boundary and tested the real flag path. |
| m5-task-012 | regression canary | revised-baldpatch-skill | 3/3 | Revised preserved the wrapper-collapse win with a focused shared `formatAmount` helper and label-preserving tests. |

## Interpretation

M7 supports the post-M5 narrowing more than M5 supported the provisional wording.
It recovered six of the eight prior M5 loss tasks and preserved one of two
regression canaries. That is useful reviewer-value evidence.

It is still not graduation evidence:

- Vote margin is exactly the gate threshold: 18/30.
- Several wins are low-information tie-breakers on nearly identical patches.
- The injected timer canary regressed on reviewer preference.
- Median LOC did not improve, so the "smaller patch" claim is still unproven.

## Decision

Treat M7 as a positive but strict-gate-incomplete result:

- Keep Bald Patch docs-first and advisory.
- Do not add hooks, plugins, or stronger automation.
- Do not claim the revised skill reliably produces smaller patches.
- Preserve the revised post-M5 skill wording as a reasonable narrowing, but
  treat it as provisional reviewer-value guidance.
- Before another skill edit, inspect the M7 losses and decide whether an M8
  run should focus on injected timer proof, low-information tie-breakers, and
  LOC pressure.

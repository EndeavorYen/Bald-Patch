# Bald Patch M5 Holdout Analysis - 2026-06-18

## Verdict

M5 does not support graduating the provisional reviewer-proof skill.

The coding runs passed correctness across all arms, but the three-reviewer blind
review did not prefer the provisional skill over the old skill or natural
baseline.

Aggregate evidence from `2026-06-18-m5-holdout-reviewed`:

| Arm | Success | Median LOC | Tool calls | Reviewer preference | Median rework | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| natural-baseline | 12/12 | 17 | 12 | 33% | 3 | 5 |
| old-baldpatch-skill | 12/12 | 18 | 9.5 | 33% | 2 | 3 |
| prompt-control | 12/12 | 17 | 13 | 6% | 5 | 5 |
| provisional-baldpatch-skill | 12/12 | 17.5 | 10 | 28% | 4.5 | 4 |

Preference votes were:

- natural-baseline: 12/36
- old-baldpatch-skill: 12/36
- provisional-baldpatch-skill: 10/36
- prompt-control: 2/36

Task-level winners were evenly split between natural-baseline, old skill, and
provisional skill: each won 4/12 tasks. Prompt-control won 0/12 tasks.

## Methodology Note

The reviewed packet was a four-arm blind comparison, not the stricter pairwise
primary packet described in `docs/m5-holdout-design.md`. That means M5 should not
be claimed as a formal primary-gate pass/fail on pairwise preference alone.

However, the four-arm signal is already enough to reject the strong claim that
the provisional skill generalizes. A skill that is ready to graduate should not
trail both the old skill and natural baseline in reviewer votes on the holdout
suite.

## Gate Readout

| Gate | Result | Readout |
| --- | --- | --- |
| Correctness not worse | pass | All arms succeeded 12/12. |
| Beats old skill in reviewer preference | fail | Provisional received 10/36 votes; old skill received 12/36. |
| Beats prompt-control in reviewer preference | pass | Provisional received 10/36 votes; prompt-control received 2/36. |
| Competitive with natural-baseline | fail | Provisional received 10/36 votes; natural-baseline received 12/36. |
| Median expected rework not worse | fail | Provisional median rework was 4.5, worse than old skill 2 and natural-baseline 3. |
| Underbuild findings not higher | mixed | Provisional had 4 underbuild findings, better than natural/prompt at 5 but worse than old skill at 3. |
| Median LOC not higher than old skill | pass | Provisional median LOC was 17.5 vs old skill 18. |
| Tool calls within 15% of old skill | pass | Provisional median tool calls were 10 vs old skill 9.5. |
| No holdout unanimous reviewer loss from overfitting | pass | No holdout task had a unanimous provisional loss caused by rule overfitting. |

## Task-Level Findings

| Task | Case | Winner | Provisional votes | Readout |
| --- | --- | --- | ---: | --- |
| m5-task-001 | known failure | old-baldpatch-skill | 0/3 | Existing focused proof plus small CLI coverage beat the provisional behavior. |
| m5-task-002 | known failure | old-baldpatch-skill | 0/3 | Reviewers preferred deterministic injected timers, but that patch mapped to the old skill run. |
| m5-task-003 | known failure | natural-baseline | 0/3 | Broader invalid-email coverage beat the provisional output. |
| m5-task-004 | known failure | old-baldpatch-skill | 0/3 | All implementations were similar; old skill had the preferred test shape. |
| m5-task-005 | known failure | old-baldpatch-skill | 0/3 | Explicit dry-run output proof was reviewer-valued, but the preferred patch came from old skill. |
| m5-task-006 | known failure | provisional-baldpatch-skill | 2/3 | Provisional won on shared helper usage while preserving labels. |
| m5-task-007 | holdout downside | natural-baseline | 0/3 | Helper extraction was justified, but natural-baseline produced the clearest helper. |
| m5-task-008 | holdout downside | provisional-baldpatch-skill | 3/3 | Provisional produced the clearest injected-delay test wording. |
| m5-task-009 | holdout downside | provisional-baldpatch-skill | 2/3 | Provisional balanced traversal protection and over-restriction best. |
| m5-task-010 | holdout downside | natural-baseline | 0/3 | Own-property optional-field handling was preferred from natural-baseline. |
| m5-task-011 | holdout downside | natural-baseline | 0/3 | Natural-baseline kept the terse CLI behavior with the smallest API surface. |
| m5-task-012 | holdout downside | provisional-baldpatch-skill | 3/3 | Provisional won the explicit wrapper-collapse downside case. |

## Fixture Corrections

Two M5 fixture issues were corrected during execution and affected rows were
rerun before building the reviewed record:

- `m5-task-008`: the prompt did not specify where `delayMs` should live, while
  acceptance expected a third argument. The task now explicitly asks for the
  existing options object and acceptance checks that shape.
- `m5-task-012`: acceptance over-constrained receipt formatting to `$9.87` even
  though preserving `9.87 USD` is a reasonable reading of the request. Acceptance
  now allows both while still requiring obsolete wrapper exports to be removed.

The canonical reviewed run file uses the rerun rows after these corrections.

## Rule Implications

The provisional rules should not be treated as generally effective yet.

What appears useful:

- Wrapper-related wording helped on `m5-task-006` and `m5-task-012`.
- Scoped proof for injected timer behavior helped on `m5-task-008`.
- Validation/downside wording helped on `m5-task-009`.

What did not generalize:

- Tiny-branch guidance still did not beat old skill on `m5-task-001`.
- Validation guidance did not beat natural-baseline on `m5-task-003`.
- Form/default guidance did not beat old skill or natural-baseline on
  `m5-task-004` and `m5-task-010`.
- Terse CLI downside handling did not beat natural-baseline on `m5-task-011`.

## Decision

Treat M5 as negative or at best mixed evidence:

- Keep the project docs-first.
- Do not add hooks, plugins, or stronger automation.
- Do not claim the provisional skill improves reviewer preference.
- Preserve the M5 evidence as a failure analysis.
- Consider either rolling back the provisional skill wording or narrowing it to
  the rule areas that showed repeatable reviewer value.

The next work should be diagnosis, not expansion: inspect why old skill and
natural-baseline produced the preferred patches, then decide whether a smaller
skill edit is justified.

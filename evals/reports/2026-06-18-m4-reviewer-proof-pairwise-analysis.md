# Bald Patch M4 Reviewer-Proof Pairwise Analysis - 2026-06-18

## Verdict

M4 produced a strong reviewer-preference signal, but it did not pass the full
conservative canary gate.

Aggregate evidence from `2026-06-18-m4-reviewer-proof-pairwise-reviewed`:

| Arm | Success | Median LOC | Tool calls | Reviewer preference | Median rework | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| baldpatch-skill | 6/6 | 18 | 10 | 22% | 0 | 0 |
| m4-reviewer-proof-control | 6/6 | 25 | 11.5 | 78% | 0 | 0 |

M4 won 5/6 tasks and 14/18 reviewer votes against the same-day
`baldpatch-skill` rerun. That is enough signal to draft a provisional skill
update. It is not enough to claim Bald Patch is fixed, because two acceptance
checks failed:

- M4 had one unanimous task loss: `task-001`.
- M4 median LOC was higher than the skill rerun: 25 vs 18.

## Acceptance Readout

| Gate | Result | Readout |
| --- | --- | --- |
| Correctness | pass | M4 succeeded 6/6 tasks. |
| Task-level preference | pass | M4 won 5/6 pairwise tasks. |
| Vote-level preference | pass | M4 received 14/18 reviewer votes. |
| No unanimous M4 loss | fail | Reviewers preferred skill 3/3 on `task-001`. |
| LOC not higher | fail | M4 median LOC was 25 vs skill 18. |
| Tool-call budget | pass | M4 median tool calls were 11.5 vs skill 10, exactly 15% higher. |
| Rework not worse | pass | Both arms had median expected rework of 0. |
| Underbuild not worse | pass | Both arms had 0 underbuild findings. |

## Task-Level Findings

| Task | Winner | M4 votes | M4 LOC | Skill LOC | Readout |
| --- | --- | ---: | ---: | ---: | --- |
| task-001 | baldpatch-skill | 0/3 | 28 | 19 | The tiny-branch rule over-corrected: M4 tested only through `main()` and removed the existing focused `buildSummary` / `formatText` assertions. Reviewers preferred keeping existing unit proof and adding a small JSON CLI test. |
| task-002 | m4-reviewer-proof-control | 3/3 | 25 | 24 | Scoped deterministic timer proof was clearly reviewer-valued, even with one extra LOC and higher tool calls. |
| task-003 | m4-reviewer-proof-control | 2/3 | 29 | 46 | Boundary-focused validation proof improved reviewability and reduced LOC, but one reviewer still preferred the explicit helper and broader invalid-address coverage. |
| task-005 | m4-reviewer-proof-control | 3/3 | 25 | 15 | Reviewers preferred stronger populated/default form-state tests even though M4 had a larger test diff. |
| task-008 | m4-reviewer-proof-control | 3/3 | 23 | 15 | Minimal semantic output labels plus write-mode preservation proof removed rework risk reviewers saw in the skill output. |
| task-011 | m4-reviewer-proof-control | 3/3 | 13 | 17 | Preserving existing wrapper call paths improved reviewability and reduced LOC. |

## Rule Implications

The M4 rules are not equally ready for skill text.

Rules with strong positive evidence:

- Prefer scoped deterministic timer facilities over real sleeps or global timer
  ceremony.
- For form-state additions, prove both populated field state and default state
  preservation when the existing API exposes defaults.
- For user-facing script output, include the smallest semantic label that makes
  new data unambiguous.
- When introducing a shared helper, preserve existing wrapper call paths unless
  the request explicitly asks to collapse them.

Rules that need narrower wording:

- Tiny branch / helper guidance should not tell the agent to replace existing
  focused unit proof with only public-entry-point proof. Better wording:
  preserve existing focused tests, and add the smallest public behavior test
  needed for the new branch; do not add/export a helper solely to make that
  tiny branch testable.
- Validator guidance should keep the accepted/rejected boundary requirement, but
  avoid implying that a compact regex is automatically enough. Reviewers still
  value explicit malformed-domain coverage.

## Decision

Treat M4 as a positive but mixed canary:

- It supports drafting a provisional `$baldpatch-patch` update.
- It does not support declaring the skill fixed.
- It does not support hooks, plugins, or broader automation.
- The provisional skill draft must preserve LOC pressure and avoid replacing
  existing high-signal tests with broader but weaker public-entry tests.

The next phase should be M5 holdout: compare the updated skill against the old
skill, natural baseline, and prompt control on 12-18 tasks, with at least half
holdout tasks and explicit positive/negative cases for each rule.

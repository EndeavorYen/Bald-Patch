# Bald Patch Final Report

> **TL;DR** — Bald Patch should close this phase as an anti-overbuild eval and review evidence toolkit, not as a proven patch-generation skill. M1-M9 show the live `$baldpatch-patch` skill is useful as provisional guidance, but it has not reliably improved reviewer preference, expected rework, or patch size. The reusable project value is the eval and review evidence flow.

## Final Decision

Bald Patch remains docs-first and advisory. The live patch skill is frozen after
M9, and future work should focus on E1/E2/E3: task discrimination, realistic
task suites, and review evidence productization.

Do not claim that Bald Patch reliably produces smaller or more reviewable
patches. Do not add hooks, plugins, always-on automation, or more skill wording
tuning from the current evidence.

## Evidence Timeline

| Milestone | Question | Result | Decision |
| --- | --- | --- | --- |
| M1 | Can the basic A/B harness measure real Codex patches? | Correctness held; skill got 4/10 reviewer preferences and baseline got 6/10. | Keep the harness; do not expand from M1 alone. |
| M2 | Does Bald Patch beat natural and generic prompt controls? | All arms passed 11/11; Bald Patch lowered tool calls by 15% but got 21% reviewer preference. | Reviewer signal did not support skill claims. |
| M3 | Does reviewer-trust guidance fix M2 failure cases? | All arms passed 6/6; Bald Patch got 11% preference and higher median LOC than controls. | Guidance was too coarse; diagnose reviewer-valued proof shape. |
| M4 | Do explicit reviewer-proof rules help known failure cases? | M4 won 5/6 tasks and 14/18 votes, but lost one task 3/3 and had higher median LOC. | Positive canary only; draft provisional wording for holdout testing. |
| M5 | Does provisional wording generalize on holdout tasks? | All arms passed 12/12; provisional skill got 10/36 votes, behind old skill and natural baseline at 12/36 each. | Negative/mixed; do not graduate the skill. |
| M6 | What should happen after M5 failure? | M5 rules were narrowed into conditional post-M5 constraints. | Keep skill docs-first; require pairwise evidence before further claims. |
| M7 | Does the narrowed skill beat the old skill? | Revised skill won 7/10 tasks and 18/30 votes, but failed the LOC gate and had noisy tie-break wins. | Reviewer-positive but strict-gate-incomplete. |
| M8 | Does a timer-proof addendum fix the timer canary? | Coding passed 12/12; partial review favored revised skill on the primary timer canary. | Do not change the live skill; run repeatability before any proposal. |
| M9 | Is the timer result stable across same-arm seeds? | Coding passed 20/20; draft got 3/15 votes on the primary timer task and 10/30 aggregate votes. | Freeze skill; reject the timer-proof addendum. |

## Positive Evidence

- The harness can run resettable fixtures, collect run records, score metrics,
  build blind packets, decode reviewer answers, and report gates.
- `baldpatch-review` and `scope-lint` produced useful advisory evidence without
  becoming blocking automation.
- M4 and M7 show that some reviewer-proof constraints can help in narrow
  contexts.
- Tool calls often improved: M2 and M3 both showed lower median tool calls for
  the skill arm.

## Negative Evidence

- The live skill never proved the central claim: better reviewer preference,
  lower expected rework, and smaller patches at the same time.
- M2 and M3 reviewer preference strongly favored controls over Bald Patch.
- M5 failed the generalization check: provisional wording trailed both old skill
  and natural baseline in reviewer votes.
- M9 rejected the only post-M8 skill-change candidate: the timer-proof draft
  lost the primary canary by 3/15 votes.

## Noisy Or Inconclusive Evidence

- Several M7 wins were low-information tie-breakers where patches were nearly
  equivalent and reviewers chose based on test names or small wording details.
- Micro fixtures often made correct patches too similar, weakening reviewer
  preference as a signal.
- M8 was only partially reviewed, so it could diagnose the timer addendum but
  could not act as a full adoption gate.
- LOC was not reliable by itself: larger patches sometimes reduced reviewer
  doubt, and smaller patches sometimes increased underbuild concern.

## Why The Live Skill Stays Frozen

The live `$baldpatch-patch` skill stays frozen because M9 completed the cleanest
repeatability check and did not support another wording change. More prompt
tuning against the current micro fixtures would likely overfit noisy review
signals rather than improve real patch quality.

The skill remains useful as conservative guidance: keep diffs small, avoid
unneeded dependencies, preserve safety checks, and add proof only when it
reduces reviewer doubt. It is not a validated product claim.

## Why Hooks And Plugins Stay Out Of Scope

Hooks and plugins would turn advisory guidance into stronger automation before
the evidence supports that move. The current data does not show durable human
value, and some reviewer preferences are noisy or task-specific.

Automation can be reconsidered only after a higher-quality holdout shows stable
reviewer preference or expected rework gains without underbuild risk.

## Reusable Assets

| Asset | Status | Use |
| --- | --- | --- |
| `scripts/scope-lint.mjs` | Mature enough to reuse as advisory evidence tooling | Detect dependency churn, broad surfaces, and suspicious abstractions. |
| `scripts/baldpatch-review.mjs` | Mature enough to reuse as advisory evidence tooling | Produce advisory overbuild review findings. |
| Blind review packet builder | Mature enough to reuse as advisory evidence tooling | Compare anonymized patches without exposing arm names. |
| Blind review decoder | Mature enough to reuse as advisory evidence tooling | Apply reviewer votes, rework, and risk fields back to run records. |
| `scripts/score-run.mjs` | Mature enough to reuse as advisory evidence tooling | Render deterministic Markdown reports and gate checks. |
| Run record JSONL format | Mature enough to reuse as advisory evidence tooling | Preserve comparable coding and review evidence. |
| `$baldpatch-patch` skill | Frozen, provisional | Conservative small-diff guidance only. |
| M1-M9 reports | Historical evidence | Explain the pivot and prevent repeated overfitting loops. |

## Restart Criteria

Restart skill research only if E1/E2/E3 first improve the evidence surface:

- E1: Eval discrimination improves so reviewer preference is not mostly a
  wording tie-break.
- E2: A realistic, fully verifiable task suite exists with holdout tasks and
  meaningful reviewer-visible tradeoffs.
- E3: Review evidence artifacts are easy enough for maintainers to run and
  interpret without reading every historical report.

A future skill-change proposal should require a complete three-reviewer blind
review, stable reviewer preference, no added underbuild risk, and lower expected
rework or another clearly stated reviewer-value gain.

## References

- [Post-M9 project posture](posture.md)
- [Closure plan](closure-plan.md)
- [M1 reviewed evidence analysis](../evals/reports/2026-06-18-m1-codex-reviewed-analysis.md)
- [M2 reviewed eval report](../evals/reports/2026-06-18-m2-codex-reviewed.md)
- [M3 failure analysis](../evals/reports/2026-06-18-m3-smoke-failure-analysis.md)
- [M4 pairwise analysis](../evals/reports/2026-06-18-m4-reviewer-proof-pairwise-analysis.md)
- [M5 holdout analysis](../evals/reports/2026-06-18-m5-holdout-analysis.md)
- [M6 skill diagnosis](../evals/reports/2026-06-18-m6-skill-diagnosis.md)
- [M7 pairwise analysis](../evals/reports/2026-06-18-m7-pairwise-analysis.md)
- [M8 diagnostic analysis](../evals/reports/2026-06-19-m8-diagnostic-analysis.md)
- [M9 repeatability analysis](../evals/reports/2026-06-19-m9-repeatability-analysis.md)

# Post-M9 Project Posture

> **TL;DR** — Bald Patch should now be treated as an anti-overbuild eval and review evidence system, not as a proven patch-generation skill. The live patch skill is frozen until stronger evidence justifies changing it.

## Current Stance

Bald Patch still addresses a real problem: agent patches can overbuild,
broaden APIs, add avoidable dependencies, or become harder to review.

M1-M9 did not prove that live `$baldpatch-patch` wording reliably improves
reviewer preference, expected rework, or patch size. M9 completed the cleanest
repeatability check so far and did not support adopting the timer-proof
addendum.

## Asset Inventory

Bald Patch should now be read as a toolkit with four asset classes.

### Mature Assets

| Asset | Use |
| --- | --- |
| `scripts/scope-lint.mjs` | Advisory scope evidence for dependency churn, broad surfaces, and suspicious abstractions. |
| `scripts/baldpatch-review.mjs` | Non-blocking review findings for overbuild risks. |
| Blind review packet flow | Anonymized patch comparison without exposing arm names. |
| `scripts/apply-blind-review.mjs` | Decoded reviewer votes, expected rework, and risk fields. |
| `scripts/score-run.mjs` | Deterministic reports and acceptance-gate summaries. |
| JSONL run records | Durable evidence for coding rows, reviewer rows, and blocked runs. |

### Experimental Assets

| Asset | Use |
| --- | --- |
| `$baldpatch-patch` live skill | Frozen, provisional small-diff guidance. It is not a proven advantage claim. |
| Skill snapshots under `evals/skill-snapshots/` | Historical comparisons for old, provisional, and revised skill prompts. |

### Historical Evidence

| Asset | Use |
| --- | --- |
| M1-M9 reports | Explain what was tested, what failed, and why the project pivoted. |
| M1-M9 run records and review summaries | Reproduce evidence tables and reviewer preference claims. |
| Fixture definitions | Preserve the micro-task evidence base while E1 decides what to keep or retire. |

### Deferred Work

| Item | Condition To Revisit |
| --- | --- |
| Hooks, plugins, or always-on automation | Only after durable reviewed evidence shows human value. |
| More live skill wording edits | Only after E1/E2/E3 produce better task discrimination and review evidence. |
| New external eval rounds | Only after a written design explains why the task suite is less noisy than M1-M9. |

## Next Tracks

| Track | Goal |
| --- | --- |
| [E1: Eval Discrimination](https://github.com/EndeavorYen/Bald-Patch/issues/59) | Audit tasks and reviewer prompts so correct patches differ on behavior, risk, or rework instead of wording tie-breakers. |
| [E2: Realistic Task Suite](https://github.com/EndeavorYen/Bald-Patch/issues/60) | Design larger but fully verifiable repo slices that better represent real review pressure. |
| [E3: Review Evidence Productization](https://github.com/EndeavorYen/Bald-Patch/issues/61) | Make review packets, decoded summaries, scope evidence, and reports easier to run and consume. |

The phase-close target and track gates are in [closure-plan.md](closure-plan.md).

## Stop Rule

If the next higher-quality holdout still cannot show stable, repeatable gains in
reviewer preference or expected rework, stop skill research and keep Bald Patch
as eval and review tooling.

## Restart Criteria

Restart skill research only when all of these are true:

- A task suite has higher discrimination than the M1-M9 micro fixtures.
- Reviewer preference is not mostly driven by test names, fixture wording, or
  equivalent-patch tie-breakers.
- Expected rework improves or another reviewer-value gain is stated before the
  run.
- Underbuild, overbuild, and dependency risk do not increase.
- The proposal completes a same-day, complete three-reviewer blind review.

If any criterion is missing, keep work in E1/E2/E3 instead of editing the live
skill.

## Boundaries

- Do not add hooks, plugins, or always-on automation from the current evidence.
- Do not tune live skill wording from M9 or other noisy micro-fixture losses.
- Do not claim Bald Patch reliably produces smaller patches.
- Do invest in review evidence, task quality, and reproducible eval reports.

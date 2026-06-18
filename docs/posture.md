# Post-M9 Project Posture

> **TL;DR** — Bald Patch should now be treated as an anti-overbuild eval and review evidence system, not as a proven patch-generation skill. The live patch skill is frozen until stronger evidence justifies changing it.

## Current Stance

Bald Patch still addresses a real problem: agent patches can overbuild,
broaden APIs, add avoidable dependencies, or become harder to review.

M1-M9 did not prove that live `$baldpatch-patch` wording reliably improves
reviewer preference, expected rework, or patch size. M9 completed the cleanest
repeatability check so far and did not support adopting the timer-proof
addendum.

## Asset Map

| Area | Status | Use |
| --- | --- | --- |
| `baldpatch-review` and `scope-lint` | Mature enough to reuse | Advisory overbuild and scope evidence. |
| Blind review packet flow | Mature enough to reuse | Reviewer preference, rework, and risk evidence. |
| Run records and scoring | Mature enough to reuse | Comparable eval reports and gate checks. |
| `$baldpatch-patch` live skill | Frozen, provisional | Small-diff guidance only; not a proven advantage claim. |
| Micro fixture skill tuning | Paused | Too noisy for more wording tweaks without better discrimination. |

## Next Tracks

| Track | Goal |
| --- | --- |
| [E1: Eval Discrimination](https://github.com/EndeavorYen/Bald-Patch/issues/59) | Audit tasks and reviewer prompts so correct patches differ on behavior, risk, or rework instead of wording tie-breakers. |
| [E2: Realistic Task Suite](https://github.com/EndeavorYen/Bald-Patch/issues/60) | Design larger but fully verifiable repo slices that better represent real review pressure. |
| [E3: Review Evidence Productization](https://github.com/EndeavorYen/Bald-Patch/issues/61) | Make review packets, decoded summaries, scope evidence, and reports easier to run and consume. |

## Stop Rule

If the next higher-quality holdout still cannot show stable, repeatable gains in
reviewer preference or expected rework, stop skill research and keep Bald Patch
as eval and review tooling.

## Boundaries

- Do not add hooks, plugins, or always-on automation from the current evidence.
- Do not tune live skill wording from M9 or other noisy micro-fixture losses.
- Do not claim Bald Patch reliably produces smaller patches.
- Do invest in review evidence, task quality, and reproducible eval reports.

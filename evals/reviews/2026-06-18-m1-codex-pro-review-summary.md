# Bald Patch M1 Pro Review Summary - 2026-06-18

Source: user-provided external pro model review. The private blind mapping key was not provided to the reviewer and is not stored in this repo.

## Overall Verdict

- Score: 6/10.
- Bald Patch addresses a real agent overbuild problem.
- M1 is a calibration run, not proof that Bald Patch works.
- Current shape is best treated as an honest eval scaffold and advisory guardrail, not a production hard gate.

## Main Measurement Risks

- Baseline contamination: the M1 baseline prompt already includes overbuild-risk hints, so it is not a clean natural baseline.
- Benchmark leakage: task ids and success criteria expose traps such as avoiding lodash, avoiding plugin architecture, and avoiding rewrites.
- Low realism: the M1 fixture suite is small and mostly Node/JavaScript toy tasks.
- Weak signals: dependency, scope, human rework, and reviewer preference were not strong enough before blind review decoding.

## M2 Direction

1. Use at least three arms: natural baseline, generic prompt-only anti-overbuild control, and Bald Patch skill.
2. Remove task-id/prompt leakage and add holdout tasks or private acceptance/review packets.
3. Make reviewer preference and expected human rework first-class metrics, ideally with multiple reviewers and agreement reporting.

## Decision Guidance

Continue to M2 only if M2 is redesigned rather than expanded from M1. If a clean M2 still shows only 0-5% LOC noise, no reviewer preference, no dependency/scope improvement, or underbuild regressions, reduce Bald Patch to a compact guideline/checklist instead of an independent guardrail.

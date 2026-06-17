# M2 Eval Design

M2 should test whether Bald Patch improves real agent patches beyond ordinary prompt hygiene. It should not be a larger version of M1.

## Goal

Answer this question:

> Does Bald Patch reduce avoidable overbuild and reviewer rework without increasing correctness, safety, or underbuild failures?

M2 should compare Bald Patch against both natural agent behavior and a generic anti-overbuild prompt. This separates the value of the skill from the value of simply warning the model not to overbuild.

## Experimental Arms

Use at least three arms:

| Arm | Prompt shape | Purpose |
| --- | --- | --- |
| natural-baseline | Product request only | Measures default agent behavior. |
| prompt-control | Product request plus generic anti-overbuild instruction | Measures ordinary prompt hygiene. |
| baldpatch-skill | Product request plus `$baldpatch-patch` | Measures Bald Patch-specific guidance. |

Optional fourth arm:

| Arm | Prompt shape | Purpose |
| --- | --- | --- |
| baldpatch-skill-review | `$baldpatch-patch` followed by `$baldpatch-review` | Measures whether the review pass catches overbuild before submission. |

## Current Tooling

Generate the three-arm M2 queue:

```bash
node scripts/run-ab.mjs --mode m2 --jsonl > /private/tmp/bald-patch-m2-plan.jsonl
```

Preview or execute a single M2 row with the existing local runner:

```bash
node scripts/run-m1-eval.mjs \
  --mode m2 \
  --task parser-edge-case \
  --arm prompt-control
```

M2 mode emits `natural-baseline`, `prompt-control`, and `baldpatch-skill` rows. The natural baseline prompt uses `neutral_title` and `natural_prompt` task fields when present; it does not append M1 success criteria or task-specific overbuild risks.

The current M2 queue keeps the original 10 M1 tasks and adds one M2-only positive-control task, `task-011`, backed by the private fixture id `shared-format-helper`. M1 task loading still defaults to the original 10-task set.

Reviewer-facing M2 task ids use neutral `public_id` values such as `task-001`. The run queue may include `fixture_task_id` so local tooling can prepare and verify the correct fixture, but blind review packets must omit `fixture_task_id`, run ids, arm names, model names, and any private mapping key.

## Leakage Controls

- Use neutral task ids. Avoid names such as `without-lodash`, `no-plugin`, or `no-rewrite`.
- Do not include overbuild traps in natural-baseline prompts.
- Treat `fixture_task_id` as operator-private metadata. It is allowed in local run queues, not in blind review packets.
- Keep any mapping key outside the repo.
- Keep final acceptance checks or holdout task variants private when running a release-quality benchmark.
- Build blind review packets with `scripts/build-blind-review-packet.mjs`; packets must omit run ids, arm names, model names, `fixture_task_id`, and mapping hints.

## Task Suite

Target 30-50 tasks before treating M2 as evidence. Include:

- CLI changes with backwards-compatible output requirements.
- Frontend changes where platform-native controls are viable.
- Backend/API changes with compatibility constraints.
- Data validation tasks with pragmatic validation boundaries.
- Settings and migration tasks.
- Auth, permission, sanitization, or data-loss-sensitive tasks.
- Positive-control tasks where a dependency, abstraction, or broader refactor is justified.

The positive controls are required. Without them, Bald Patch may look good by underbuilding.

## Reviewer Metrics

Use at least three blind reviewers when possible. Ask for:

- preferred patch
- accept/request-changes decision
- expected human rework minutes
- requirements score
- correctness and safety score
- test adequacy score
- maintainability/reviewability score
- dependency judgment: none, justified, avoidable
- abstraction/rewrite judgment: justified, avoidable, underbuilt

Report reviewer agreement instead of relying on a single preference count.

Use `scripts/apply-blind-review.mjs` with one `--answers` file per reviewer. Rich answer files should include per-patch accept/request-changes decisions, expected rework minutes, rubric scores, dependency judgment, and abstraction judgment.

## Analysis

Report paired deltas by task:

- success and hidden acceptance
- LOC and files changed
- dependency additions, labeled justified or avoidable
- scope warnings and broad rewrites
- tool calls and elapsed time, treated as secondary metrics
- reviewer preference and expected rework
- underbuild regressions

For aggregate claims, report median deltas, sign-test style win counts, and uncertainty intervals where sample size permits.

## Go/No-Go

Continue building Bald Patch beyond advisory docs only if M2 shows:

- no correctness or safety regression versus natural baseline and prompt-control
- reviewer preference for Bald Patch at or above the target threshold
- lower expected reviewer rework
- fewer avoidable dependencies, abstractions, or broad rewrites
- no increase in underbuild failures on positive-control tasks

If M2 still shows only small LOC noise, weak reviewer preference, no dependency/scope signal, or underbuild regressions, reduce Bald Patch to a compact guideline/checklist instead of a standalone guardrail.

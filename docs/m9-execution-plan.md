# M9 Execution Plan

> **TL;DR** — M9 has a local 20-row repeatability plan. External coding and
> blind review remain approval-gated, and the required deliverable is a
> repeatability report rather than a skill patch.

## 1. Generate The Queue

M9 uses two tasks, two arms, and five seeds:

- `revised-baldpatch-skill`
- `m9-timer-proof-draft`

Generate the 20-row queue:

```bash
node scripts/run-ab.mjs --mode m9 --jsonl > /private/tmp/bald-patch-m9-plan.jsonl
```

Preview one seeded row:

```bash
node scripts/run-m1-eval.mjs \
  --mode m9 \
  --task m5-holdout-injected-timer \
  --arm m9-timer-proof-draft \
  --out-root /private/tmp/bald-patch-m9 \
  --run-id-prefix 2026-06-19-m9 \
  --limit 1
```

The first draft row should use a run id shaped like:

```text
2026-06-19-m9-m5-task-008-seed-1-m9-timer-proof-draft
```

## 2. Local Preflight

Run these before any external execution:

```bash
npm test
node scripts/run-ab.mjs --mode m9 --jsonl
node scripts/run-m1-eval.mjs --mode m9 --limit 1
```

This only proves repo wiring. It is not M9 evidence.

## 3. External Coding Eval

Do not run M9 external model rows until the user explicitly approves sending
fixture code and prompts to the external service.

When approval exists, run `run-m1-eval` with `--mode m9`, `--execute`,
`--record`, and an explicit external agent command. Record rows to:

```text
evals/runs/YYYY-MM-DD-m9-repeatability.jsonl
```

If a row is blocked, use `--record-blocked --blocker "reason"`. Do not create
synthetic successful rows.

## 4. Blind Review

After 20 successful coding rows exist:

1. Build a pairwise blind review packet from the M9 checkouts.
2. Store the answer key under `/private/tmp`, not in the repo.
3. Collect three complete reviewer answer files.
4. Decode the packet and score the run.
5. Write an M9 repeatability analysis.

`score-run` will render the M9 acceptance checks from
[M9 repeatability design](m9-repeatability-design.md), including reviewer
completeness, primary timer task, preservation task, aggregate votes, and risk
gates.

If policy blocks a reviewer packet, stop and report the incomplete review. Do
not substitute aggregate coding metrics for the missing reviewer gate.

## 5. Decision

Use the gates in [M9 repeatability design](m9-repeatability-design.md).

Passing M9 only supports opening a separate proposal to modify the live skill.
Failing or incomplete M9 means the current post-M5 skill remains unchanged.

# M8 Execution Plan

> **TL;DR** — M8 has a local 12-row plan ready for inspection, but external
> execution remains approval-gated. The run compares the revised post-M5 skill
> against a prompt-scoped timer-proof draft on six diagnostic tasks.

## 1. Generate The M8 Queue

M8 uses six tasks and two arms:

- `revised-baldpatch-skill`
- `m8-timer-proof-draft`

Generate the 12-row queue:

```bash
node scripts/run-ab.mjs --mode m8 --jsonl > /private/tmp/bald-patch-m8-plan.jsonl
```

Preview one row:

```bash
node scripts/run-m1-eval.mjs \
  --mode m8 \
  --task m5-holdout-injected-timer \
  --arm m8-timer-proof-draft \
  --out-root /private/tmp/bald-patch-m8 \
  --run-id-prefix 2026-06-19-m8
```

## 2. Local Preflight

Before any external execution:

```bash
npm test
node scripts/run-ab.mjs --mode m8 --jsonl
node scripts/run-m1-eval.mjs --mode m8 --limit 1
```

The preflight checks only repo wiring. It is not eval evidence.

## 3. External Execution Boundary

Do not run M8 external model rows until the user explicitly approves sending
fixture code and prompts to the external service.

When approval exists, use `run-m1-eval` with `--mode m8`, `--execute`,
`--record`, and an explicit external agent command. Record rows to:

```text
evals/runs/YYYY-MM-DD-m8-diagnostic.jsonl
```

If approval is missing or a row cannot run, record blocked rows with
`--record-blocked` instead of creating fake successful evidence.

## 4. Blind Review

After successful rows exist:

1. Build a pairwise blind review packet from the M8 checkouts.
2. Keep mapping keys outside the repo.
3. Collect at least three reviewer answer files.
4. Decode with `scripts/apply-blind-review.mjs`.
5. Score with `scripts/score-run.mjs`, then add a short M8-specific analysis.

The analysis must separate primary recovery, preservation, secondary tasks, and
noise controls. `m5-task-004` and `m5-task-005` cannot make the run pass.

## 5. Decision

If M8 recovers `m5-task-008` and preserves `m5-task-011`, propose a small live
skill wording change as a separate PR. If it does not, keep the current skill
and document the timer-proof failure without expanding scope.

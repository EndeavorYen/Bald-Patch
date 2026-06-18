# M5 Execution Plan

This plan prepares M5 for approval-gated external execution. It does not grant
approval to send fixture code, prompts, diffs, or reviewer packets to external
Codex/OpenAI services.

## 1. Generate The M5 Queue

M5 uses the curated task group in `evals/tasks/m5/` and four arms:

- `natural-baseline`
- `prompt-control`
- `old-baldpatch-skill`
- `provisional-baldpatch-skill`

Generate the 48-row queue:

```bash
node scripts/run-ab.mjs --mode m5 --jsonl > /private/tmp/bald-patch-m5-plan.jsonl
```

Preview one row:

```bash
node scripts/run-m1-eval.mjs \
  --mode m5 \
  --task m5-holdout-terse-cli-output \
  --arm provisional-baldpatch-skill \
  --out-root /private/tmp/bald-patch-m5 \
  --run-id-prefix 2026-06-18-m5
```

## 2. Skill Arms

M5 does not rely on the live `$baldpatch-patch` state for old/provisional
comparison. The prompts embed explicit skill snapshots:

- old skill: `evals/skill-snapshots/pre-m5-baldpatch-patch/SKILL.md`
- provisional skill: `evals/skill-snapshots/provisional-m5-baldpatch-patch/SKILL.md`

This keeps the M5 comparison stable if the repo skill changes later.

## 3. Local Preflight

Before external execution:

```bash
npm test
node scripts/run-ab.mjs --mode m5 --jsonl
node scripts/run-m1-eval.mjs --mode m5 --limit 1
```

The fixture tests verify that all 12 M5 tasks prepare from clean projects and
fail hidden acceptance before patching.

## 4. External Execution Boundary

Do not run M5 external model rows until the user explicitly approves the M5 data
transfer.

When approval exists, use `run-m1-eval` with `--mode m5`, `--execute`, `--record`,
and an explicit external Codex agent command. Record rows to:

```text
evals/runs/YYYY-MM-DD-m5-holdout.jsonl
```

If approval is missing or a row cannot run, record blocked rows with
`--record-blocked` instead of creating fake successful evidence.

## 5. Blind Review

After successful rows exist:

1. Build blind review packets from the M5 checkouts.
2. Keep mapping keys outside the repo.
3. Collect at least three reviewer answer files.
4. Decode with `scripts/apply-blind-review.mjs`.
5. Score with `scripts/score-run.mjs`.

The final M5 reviewed report must state pass/fail against the gates in
`docs/m5-holdout-design.md`.

## 6. Decision

If M5 passes, update README with reviewed M5 evidence. If M5 fails, publish the
failure analysis and keep Bald Patch docs-first; do not add hooks, plugins, or
stronger automation.

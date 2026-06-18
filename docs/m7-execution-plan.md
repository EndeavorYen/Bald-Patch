# M7 Execution Plan

This plan prepares M7 for approval-gated external execution. It does not grant
approval to send fixture code, prompts, diffs, or reviewer packets to external
Codex/OpenAI services.

## 1. Generate The M7 Queue

M7 uses the ten-task pairwise suite selected from M5 and two arms:

- `old-baldpatch-skill`
- `revised-baldpatch-skill`

Generate the 20-row queue:

```bash
node scripts/run-ab.mjs --mode m7 --jsonl > /private/tmp/bald-patch-m7-plan.jsonl
```

Preview one row:

```bash
node scripts/run-m1-eval.mjs \
  --mode m7 \
  --task m5-holdout-terse-cli-output \
  --arm revised-baldpatch-skill \
  --out-root /private/tmp/bald-patch-m7 \
  --run-id-prefix 2026-06-18-m7
```

## 2. Skill Arms

M7 does not rely on the live `$baldpatch-patch` state. The prompts embed
explicit skill snapshots:

- old skill: `evals/skill-snapshots/pre-m5-baldpatch-patch/SKILL.md`
- revised skill: `evals/skill-snapshots/post-m5-baldpatch-patch/SKILL.md`

This keeps the comparison stable if the repo skill changes later.

## 3. Local Preflight

Before external execution:

```bash
npm test
node scripts/run-ab.mjs --mode m7 --jsonl
node scripts/run-m1-eval.mjs --mode m7 --limit 1
```

The fixture tests verify that the reused M5 tasks prepare from clean projects
and fail hidden acceptance before patching.

## 4. External Execution Boundary

Do not run M7 external model rows until the user explicitly approves the M7 data
transfer.

When approval exists, use `run-m1-eval` with `--mode m7`, `--execute`, `--record`,
and an explicit external Codex agent command. Record rows to:

```text
evals/runs/YYYY-MM-DD-m7-pairwise.jsonl
```

If approval is missing or a row cannot run, record blocked rows with
`--record-blocked` instead of creating fake successful evidence.

## 5. Blind Review

After successful rows exist:

1. Build a pairwise blind review packet from the M7 checkouts.
2. Keep mapping keys outside the repo.
3. Collect at least three reviewer answer files.
4. Decode with `scripts/apply-blind-review.mjs`.
5. Score with `scripts/score-run.mjs`.

The final M7 reviewed report must state pass/fail against the gates in
`docs/m7-pairwise-design.md`.

## 6. Decision

If M7 passes, update README with reviewed M7 evidence and decide whether a
larger holdout is justified. If M7 fails, publish the failure analysis and keep
Bald Patch docs-first; do not add hooks, plugins, or stronger automation.

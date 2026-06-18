# M3 Smoke Rerun Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a small M3 smoke evaluation that checks whether the reviewer-trust guidance added in #31 improves Bald Patch outputs on the M2 tasks where reviewer preference was weakest.

**Architecture:** Reuse the existing M2 runner, fixture verifier, blind packet builder, multi-reviewer answer format, decoder, and scorer. Keep the run set to six reviewer-sensitive tasks and all three M2 arms so preference remains comparable.

**Tech Stack:** Node.js built-ins, existing `scripts/run-m1-eval.mjs`, external Codex agent command, existing review/scoring scripts, GitHub issues/PRs.

---

### Task 1: Prepare The M3 Smoke Run Set

**Files:**
- Create: `/private/tmp/bald-patch-m3-smoke-plan.jsonl`
- Read: `evals/runs/2026-06-18-m2-codex-reviewed.jsonl`
- Read: `evals/reports/2026-06-18-m2-codex-reviewed.md`

- [ ] **Step 1: Generate dry-run rows for the selected tasks**

Run one dry-run command per selected public task id:

```bash
node scripts/run-m1-eval.mjs --mode m2 --task task-001 --out-root /private/tmp/bald-patch-m3-smoke --run-id-prefix 2026-06-18-m3-smoke
node scripts/run-m1-eval.mjs --mode m2 --task task-002 --out-root /private/tmp/bald-patch-m3-smoke --run-id-prefix 2026-06-18-m3-smoke
node scripts/run-m1-eval.mjs --mode m2 --task task-003 --out-root /private/tmp/bald-patch-m3-smoke --run-id-prefix 2026-06-18-m3-smoke
node scripts/run-m1-eval.mjs --mode m2 --task task-005 --out-root /private/tmp/bald-patch-m3-smoke --run-id-prefix 2026-06-18-m3-smoke
node scripts/run-m1-eval.mjs --mode m2 --task task-008 --out-root /private/tmp/bald-patch-m3-smoke --run-id-prefix 2026-06-18-m3-smoke
node scripts/run-m1-eval.mjs --mode m2 --task task-011 --out-root /private/tmp/bald-patch-m3-smoke --run-id-prefix 2026-06-18-m3-smoke
```

Expected: 18 JSONL rows total, covering `natural-baseline`, `prompt-control`, and `baldpatch-skill` for each task.

- [ ] **Step 2: Confirm the run set targets the observed M2 weakness**

Check that the selected tasks cover the reviewer-trust failure modes:

```text
task-001: preserved default CLI output
task-002: deterministic debounce timer tests
task-003: pragmatic validator edge coverage
task-005: existing title behavior plus new due-date field
task-008: write-mode preservation plus dry-run path output
task-011: shared helper and call-site coverage
```

Expected: no broad/full-suite rerun yet.

### Task 2: Execute External Codex Runs

**Files:**
- Create: `evals/runs/2026-06-18-m3-smoke.jsonl`
- Create directories under: `/private/tmp/bald-patch-m3-smoke/`

- [ ] **Step 1: Get explicit approval for external Codex execution**

Ask for approval because fixture code and prompts will be sent to external Codex/OpenAI services.

Expected: do not run external commands without approval.

- [ ] **Step 2: Run each selected row with the existing local runner**

Use this agent command template:

```bash
rtk codex --ask-for-approval never exec --cd {fixture} --sandbox workspace-write --ignore-user-config --ignore-rules --ephemeral --skip-git-repo-check --output-last-message {artifactDir}/agent-output.txt - < {promptFile}
```

For each selected `--task`, run:

```bash
node scripts/run-m1-eval.mjs \
  --mode m2 \
  --task task-001 \
  --out-root /private/tmp/bald-patch-m3-smoke \
  --run-id-prefix 2026-06-18-m3-smoke \
  --record evals/runs/2026-06-18-m3-smoke.jsonl \
  --agent-command 'rtk codex --ask-for-approval never exec --cd {fixture} --sandbox workspace-write --ignore-user-config --ignore-rules --ephemeral --skip-git-repo-check --output-last-message {artifactDir}/agent-output.txt - < {promptFile}' \
  --execute
```

Repeat for `task-002`, `task-003`, `task-005`, `task-008`, and `task-011`.

Expected: `evals/runs/2026-06-18-m3-smoke.jsonl` contains 18 successful or honestly failed/blocked rows.

### Task 3: Build And Review The M3 Blind Packet

**Files:**
- Create: `evals/reviews/2026-06-18-m3-smoke-blind-review.md`
- Create local-only: `/private/tmp/bald-patch-m3-smoke/2026-06-18-m3-smoke-blind-key.json`
- Create: `evals/reviews/2026-06-18-m3-smoke-external-r1-answers.json`
- Create: `evals/reviews/2026-06-18-m3-smoke-external-r2-answers.json`
- Create: `evals/reviews/2026-06-18-m3-smoke-external-r3-answers.json`

- [ ] **Step 1: Build the packet**

```bash
node scripts/build-blind-review-packet.mjs \
  --mode m2 \
  --runs evals/runs/2026-06-18-m3-smoke.jsonl \
  --checkouts /private/tmp/bald-patch-m3-smoke/checkouts \
  --seed 2026-06-18-m3-smoke \
  --output-packet evals/reviews/2026-06-18-m3-smoke-blind-review.md \
  --output-key /private/tmp/bald-patch-m3-smoke/2026-06-18-m3-smoke-blind-key.json
```

Expected: packet omits run ids, arm names, model names, fixture ids, and the private mapping key.

- [ ] **Step 2: Run three blind reviewers**

Use the same rich-answer schema from M2:

```text
reviewer_id, answers[], preferred_patch, confidence, reason, per-patch decision, expected_rework_minutes, scores, dependency_judgment, abstraction_judgment
```

Expected: three valid answer files, each covering all six task ids and all three patch labels.

### Task 4: Decode, Score, And Decide

**Files:**
- Create: `evals/runs/2026-06-18-m3-smoke-reviewed.jsonl`
- Create: `evals/reviews/2026-06-18-m3-smoke-external-review-summary.md`
- Create: `evals/reports/2026-06-18-m3-smoke-reviewed.md`

- [ ] **Step 1: Decode blind review answers**

```bash
node scripts/apply-blind-review.mjs \
  --runs evals/runs/2026-06-18-m3-smoke.jsonl \
  --key /private/tmp/bald-patch-m3-smoke/2026-06-18-m3-smoke-blind-key.json \
  --answers evals/reviews/2026-06-18-m3-smoke-external-r1-answers.json \
  --answers evals/reviews/2026-06-18-m3-smoke-external-r2-answers.json \
  --answers evals/reviews/2026-06-18-m3-smoke-external-r3-answers.json \
  --output-runs evals/runs/2026-06-18-m3-smoke-reviewed.jsonl \
  --output-summary evals/reviews/2026-06-18-m3-smoke-external-review-summary.md
```

Expected: reviewed rows contain three reviewer preferences and three reviewer assessments per run.

- [ ] **Step 2: Score the reviewed smoke run**

```bash
node scripts/score-run.mjs \
  --input evals/runs/2026-06-18-m3-smoke-reviewed.jsonl \
  --output evals/reports/2026-06-18-m3-smoke-reviewed.md \
  --title "Bald Patch M3 Smoke Reviewed Eval Report - 2026-06-18"
```

Expected: report states whether Bald Patch preference improved on the targeted tasks.

- [ ] **Step 3: Verify and publish**

```bash
npm test
git diff --check
npm run review -- --base main
```

Expected: tests pass, whitespace check is clean, advisory review has 0 findings before PR/merge.

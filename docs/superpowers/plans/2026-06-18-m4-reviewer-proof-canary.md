# M4 Reviewer-Proof Canary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Test whether a narrow reviewer-proof rubric fixes the six M3 failure modes before changing `$baldpatch-patch`.

**Architecture:** Add the smallest eval-harness support for a new `m4-reviewer-proof-control` prompt-only arm, run it on the six M3 smoke tasks, compare it against the existing M3 evidence in a blind packet, and only update the skill if reviewers prefer the canary output at task level.

**Tech Stack:** Node.js built-ins, existing fixture tasks, existing `scripts/run-m1-eval.mjs`, existing blind review/scoring scripts, external Codex agent command after explicit approval, GitHub issues/PRs.

---

## Experiment Shape

M4 is an eval canary, not a skill edit. It must not change `$baldpatch-patch` until the new rubric has evidence.

Selected public tasks:

```text
task-001: CLI JSON flag
task-002: debounce behavior
task-003: signup email validation
task-005: due-date form state
task-008: dry-run output
task-011: shared format helper
```

Comparison arms:

```text
m3-baldpatch-skill: existing M3 skill outputs, used as the reference to beat
m3-natural-baseline: existing M3 natural outputs, included to preserve reviewer context
m3-prompt-control: existing M3 generic prompt-control outputs, included to preserve reviewer context
m4-reviewer-proof-control: new prompt-only arm with the six specific reviewer-proof rules
```

Primary success gate:

```text
m4-reviewer-proof-control wins at least 3/6 tasks, or gains at least 4 reviewer votes over the M3 baldpatch-skill result of 2/18 votes.
```

Secondary gates:

```text
- success remains 6/6 on fixture verification
- underbuild findings do not exceed M3 baldpatch-skill
- median LOC is not higher than M3 baldpatch-skill
- median tool calls are no more than 15% above M3 baldpatch-skill
- private blind keys remain outside the repository
```

## Expected Task-Level Movement

| Task | Expected M4 improvement | Downside risk |
| --- | --- | --- |
| task-001 | Avoid exported `formatJson`; test default and JSON behavior through existing public entry points. | Could under-test JSON serialization if the fixture already has a meaningful helper boundary. |
| task-002 | Prefer scoped fake timers from the test context over module-global mock setup. | Could miss cleanup requirements in a test environment without scoped timer mocks. |
| task-003 | State the accepted/rejected validator boundary and cover malformed domain/TLD labels. | Could over-validate email instead of staying pragmatic. |
| task-005 | Cover both populated due-date state and default serialization preservation. | Could add tests that couple too tightly to implementation details. |
| task-008 | Add a minimal semantic label such as `Would modify:` while preserving write mode. | Could make output tests brittle if they over-specify formatting. |
| task-011 | Introduce the shared helper behind existing wrapper functions and preserve wrapper call paths. | Could fail to prove the helper directly if wrapper-level tests are too indirect. |

## Reviewer-Proof Rubric

Use this exact rubric for the new prompt-only arm:

```text
Before editing, identify the smallest reviewer-visible proof for this task.

Rules:
1. Do not add or export a helper solely for a tiny branch; test existing public behavior when that is enough.
2. Prefer scoped deterministic timer facilities over global mock setup when the test framework provides them.
3. For validators, name and test the accepted/rejected boundary before choosing the implementation.
4. For stateful form additions, test both populated field state and default state preservation when the existing API exposes defaults.
5. For user-facing output, include minimal semantic labels that explain new data.
6. For shared helpers, preserve existing wrapper call paths unless the request explicitly asks to remove them.

After implementing, run the smallest meaningful verification and leave the working tree ready for diff metrics.
```

### Task 1: Add M4 Runner Support

**Files:**
- Modify: `scripts/fixture-utils.mjs`
- Modify: `scripts/run-ab.mjs`
- Modify: `scripts/run-m1-eval.mjs` only if the runner needs argument plumbing
- Read: `evals/tasks/real/cli-json-flag.json`
- Read: `evals/tasks/traps/debounce-without-lodash.json`
- Read: `evals/tasks/traps/email-validation-without-library.json`
- Read: `evals/tasks/traps/native-date-picker.json`
- Read: `evals/tasks/real/script-dry-run-output.json`
- Read: `evals/tasks/positive/shared-format-helper.json`

- [x] **Step 1: Add a new `m4` mode**

Extend `MODE_ARMS` with:

```js
m4: ["m4-reviewer-proof-control"]
```

Expected: `buildRunPlan(tasks, { mode: "m4" })` emits one run per task with arm `m4-reviewer-proof-control`.

- [x] **Step 2: Build the M4 prompt from natural task prompts plus the reviewer-proof rubric**

Implement `buildM4Prompt(task)` using:

```text
# <neutral title or title>

<natural_prompt or prompt>

<reviewer-proof rubric>
```

Expected: no `$baldpatch-patch` token appears in M4 prompts, because this is a prompt-only canary.

- [x] **Step 3: Add focused unit coverage for the new run mode**

Add or extend the existing script tests so they assert:

```text
- mode m4 emits `m4-reviewer-proof-control`
- M4 prompt includes the natural task prompt
- M4 prompt includes rule 1 and rule 6 from the rubric
- M4 prompt does not include `$baldpatch-patch`
```

Expected: test coverage locks the canary shape before any external execution.

### Task 2: Generate The M4 Dry Run

**Files:**
- Create local-only: `/private/tmp/bald-patch-m4-reviewer-proof-plan.jsonl`
- Create local-only directories under: `/private/tmp/bald-patch-m4-reviewer-proof/`

- [ ] **Step 1: Generate one dry-run row per selected task**

```bash
rtk node scripts/run-m1-eval.mjs --mode m4 --task task-001 --out-root /private/tmp/bald-patch-m4-reviewer-proof --run-id-prefix 2026-06-18-m4-reviewer-proof
rtk node scripts/run-m1-eval.mjs --mode m4 --task task-002 --out-root /private/tmp/bald-patch-m4-reviewer-proof --run-id-prefix 2026-06-18-m4-reviewer-proof
rtk node scripts/run-m1-eval.mjs --mode m4 --task task-003 --out-root /private/tmp/bald-patch-m4-reviewer-proof --run-id-prefix 2026-06-18-m4-reviewer-proof
rtk node scripts/run-m1-eval.mjs --mode m4 --task task-005 --out-root /private/tmp/bald-patch-m4-reviewer-proof --run-id-prefix 2026-06-18-m4-reviewer-proof
rtk node scripts/run-m1-eval.mjs --mode m4 --task task-008 --out-root /private/tmp/bald-patch-m4-reviewer-proof --run-id-prefix 2026-06-18-m4-reviewer-proof
rtk node scripts/run-m1-eval.mjs --mode m4 --task task-011 --out-root /private/tmp/bald-patch-m4-reviewer-proof --run-id-prefix 2026-06-18-m4-reviewer-proof
```

Expected: 6 JSONL rows, all with arm `m4-reviewer-proof-control`.

- [ ] **Step 2: Inspect prompts before external execution**

Check that every prompt contains the shared rubric and no skill invocation:

```bash
rtk node scripts/run-ab.mjs --mode m4 --jsonl
```

Expected: prompts are task-neutral, reviewer-proof, and do not leak the target result.

### Task 3: Execute External M4 Runs

**Files:**
- Create: `evals/runs/2026-06-18-m4-reviewer-proof.jsonl`
- Create local-only artifacts under: `/private/tmp/bald-patch-m4-reviewer-proof/`

- [ ] **Step 1: Get explicit approval for external execution**

Ask for approval because fixture code and prompts will be sent to external Codex/OpenAI services.

Expected: do not execute external agent commands until the user approves this specific M4 canary run.

- [ ] **Step 2: Run the six selected M4 rows**

Use this agent command template:

```bash
rtk codex --ask-for-approval never exec --cd {fixture} --sandbox workspace-write --ignore-user-config --ignore-rules --ephemeral --skip-git-repo-check --output-last-message {artifactDir}/agent-output.txt - < {promptFile}
```

For each selected task, run:

```bash
rtk node scripts/run-m1-eval.mjs \
  --mode m4 \
  --task task-001 \
  --out-root /private/tmp/bald-patch-m4-reviewer-proof \
  --run-id-prefix 2026-06-18-m4-reviewer-proof \
  --record evals/runs/2026-06-18-m4-reviewer-proof.jsonl \
  --agent-command 'rtk codex --ask-for-approval never exec --cd {fixture} --sandbox workspace-write --ignore-user-config --ignore-rules --ephemeral --skip-git-repo-check --output-last-message {artifactDir}/agent-output.txt - < {promptFile}' \
  --execute
```

Repeat with `task-002`, `task-003`, `task-005`, `task-008`, and `task-011`.

Expected: `evals/runs/2026-06-18-m4-reviewer-proof.jsonl` contains 6 honest rows with fixture verification results and diff metrics.

### Task 4: Build A Combined Blind Packet

**Files:**
- Create local-only: `/private/tmp/bald-patch-m4-reviewer-proof/combined-runs.jsonl`
- Create local-only: `/private/tmp/bald-patch-m4-reviewer-proof/combined-checkouts/`
- Create: `evals/reviews/2026-06-18-m4-reviewer-proof-blind-review.md`
- Create local-only: `/private/tmp/bald-patch-m4-reviewer-proof/2026-06-18-m4-reviewer-proof-blind-key.json`

- [ ] **Step 1: Combine M3 reference rows with M4 canary rows**

Build a combined run file containing:

```text
- the 18 rows from `evals/runs/2026-06-18-m3-smoke-reviewed.jsonl`, with reviewer fields stripped before packet building
- the 6 rows from `evals/runs/2026-06-18-m4-reviewer-proof.jsonl`
```

Use arm labels that preserve the experiment meaning:

```text
m3-baldpatch-skill
m3-natural-baseline
m3-prompt-control
m4-reviewer-proof-control
```

Expected: the packet builder sees four patches per task while reviewers still see only anonymized patch labels.

- [ ] **Step 2: Place all checkout directories under one root**

Copy the selected M3 smoke checkouts and the new M4 checkouts into:

```text
/private/tmp/bald-patch-m4-reviewer-proof/combined-checkouts/
```

Expected: each `run_id` in the combined run file has a matching checkout directory under the combined checkout root.

- [ ] **Step 3: Build the blind packet**

```bash
rtk node scripts/build-blind-review-packet.mjs \
  --mode m2 \
  --runs /private/tmp/bald-patch-m4-reviewer-proof/combined-runs.jsonl \
  --checkouts /private/tmp/bald-patch-m4-reviewer-proof/combined-checkouts \
  --seed 2026-06-18-m4-reviewer-proof \
  --output-packet evals/reviews/2026-06-18-m4-reviewer-proof-blind-review.md \
  --output-key /private/tmp/bald-patch-m4-reviewer-proof/2026-06-18-m4-reviewer-proof-blind-key.json
```

Expected: packet omits run ids, arm names, model names, fixture ids, and the private mapping key.

### Task 5: Run Blind Review

**Files:**
- Create: `evals/reviews/2026-06-18-m4-reviewer-proof-external-r1-answers.json`
- Create: `evals/reviews/2026-06-18-m4-reviewer-proof-external-r2-answers.json`
- Create: `evals/reviews/2026-06-18-m4-reviewer-proof-external-r3-answers.json`

- [ ] **Step 1: Get explicit approval for external blind review**

Ask for approval because code diffs and reviewer prompts will be sent to external Codex/OpenAI services.

Expected: do not send the blind packet externally until the user approves this specific M4 review.

- [ ] **Step 2: Run three reviewers using the existing answer schema**

Each reviewer must return:

```text
reviewer_id
answers[]
preferred_patch
confidence
reason
per-patch decision
expected_rework_minutes
scores
dependency_judgment
abstraction_judgment
underbuild_findings
```

Expected: three valid answer files, each covering all six task ids and all four anonymized patches.

### Task 6: Decode, Score, And Decide

**Files:**
- Create: `evals/runs/2026-06-18-m4-reviewer-proof-reviewed.jsonl`
- Create: `evals/reviews/2026-06-18-m4-reviewer-proof-external-review-summary.md`
- Create: `evals/reports/2026-06-18-m4-reviewer-proof-reviewed.md`

- [ ] **Step 1: Decode blind review answers**

```bash
rtk node scripts/apply-blind-review.mjs \
  --runs /private/tmp/bald-patch-m4-reviewer-proof/combined-runs.jsonl \
  --key /private/tmp/bald-patch-m4-reviewer-proof/2026-06-18-m4-reviewer-proof-blind-key.json \
  --answers evals/reviews/2026-06-18-m4-reviewer-proof-external-r1-answers.json \
  --answers evals/reviews/2026-06-18-m4-reviewer-proof-external-r2-answers.json \
  --answers evals/reviews/2026-06-18-m4-reviewer-proof-external-r3-answers.json \
  --output-runs evals/runs/2026-06-18-m4-reviewer-proof-reviewed.jsonl \
  --output-summary evals/reviews/2026-06-18-m4-reviewer-proof-external-review-summary.md
```

Expected: reviewed rows contain three reviewer preferences and reviewer assessments per run.

- [ ] **Step 2: Score the reviewed M4 canary**

```bash
rtk node scripts/score-run.mjs \
  --input evals/runs/2026-06-18-m4-reviewer-proof-reviewed.jsonl \
  --output evals/reports/2026-06-18-m4-reviewer-proof-reviewed.md \
  --title "Bald Patch M4 Reviewer-Proof Canary Reviewed Eval Report - 2026-06-18"
```

Expected: report states whether `m4-reviewer-proof-control` beat the existing M3 skill output on task-level reviewer preference.

- [ ] **Step 3: Make the skill-edit decision**

Decision rule:

```text
If M4 passes the primary and secondary gates, open a separate issue and plan to update `$baldpatch-patch`.
If M4 fails, do not edit the skill; write a failure analysis and decide whether the issue is prompt specificity, task overfitting, reviewer subjectivity, or eval harness design.
```

Expected: no skill changes are made from weak or ambiguous evidence.

### Task 7: Verify And Publish

**Files:**
- Update: `README.md` only after reviewed M4 evidence exists
- Update: issue tracker with M4 result and next step

- [ ] **Step 1: Run local verification**

```bash
rtk npm test
rtk git diff --check
rtk npm run review -- --base main
```

Expected: tests pass, whitespace check is clean, advisory review has 0 findings before PR/merge.

- [ ] **Step 2: Publish the design and execution evidence**

Open PRs in this order:

```text
1. Runner support plus this M4 canary plan.
2. M4 external run evidence after user approval.
3. M4 blind review evidence after user approval.
4. Skill update only if M4 passes the decision rule.
```

Expected: each PR is small enough to review independently, and issue #35 closes once this written plan is merged.

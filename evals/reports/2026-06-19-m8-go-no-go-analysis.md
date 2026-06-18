# Bald Patch M8 Go/No-Go Analysis - 2026-06-19

> **TL;DR** — M8 should proceed as a targeted diagnostic, not as a broad holdout
> or immediate skill rewrite. M7 showed reviewer value for the post-M5 narrowing,
> but the evidence is too thin to change the graduation bar: the injected-timer
> canary regressed, several wins were low-information tie-breakers, and the LOC
> gate still failed.

## Verdict

Go for M8 diagnostic planning. No-go for skill changes, hooks, plugins, or a
larger holdout until the M7 signal is better separated from tie-break noise.

The external Grok review of the current tree found no blocking code findings and
agreed with the current posture: Bald Patch is disciplined, docs-first,
evidence-first, and not ready to claim durable smaller-patch wins.

## Inputs

| Source | Readout |
| --- | --- |
| M7 reviewed eval | Revised skill won 7/10 tasks and 18/30 votes, but failed the strict LOC gate. |
| M7 task analysis | Strong wins exist, but several wins/losses came from nearly identical patches. |
| Grok project review | No blocking findings; supports M8 focus on timer proof, low-info tie-breakers, and LOC pressure. |
| Local verification | `npm test`, scope lint, diff metrics, and Bald Patch review were clean at HEAD. |

## Decision Matrix

| Option | Decision | Reason |
| --- | --- | --- |
| Change `$baldpatch-patch` now | No-go | M7 already tests the narrowed skill. The remaining failures are diagnostic, not enough for another wording patch. |
| Run a larger holdout now | No-go | Larger scale would amplify unresolved measurement noise around ties and LOC. |
| Add hooks/plugins/automation | No-go | M7 is reviewer-positive, but strict-gate-incomplete. Automation would overclaim. |
| Run M8 targeted diagnostic | Go | The next useful question is why the signal is mixed, not whether to expand scope. |

## M7 Signal Quality

| Task | Winner | Confidence signal | M8 implication |
| --- | --- | --- | --- |
| `m5-task-001` | revised 2/3 | Real split: semantic JSON assertion vs smaller one-path output. | Keep as evidence, but do not over-weight. |
| `m5-task-002` | revised 2/3 | Moderate recovery; one reviewer preferred old with higher confidence. | Check timer wording before editing. |
| `m5-task-003` | revised 2/3 | Real tradeoff: trimming/named regex vs smaller inline regex. | Needs boundary-policy clarity, not more tests. |
| `m5-task-004` | revised 3/3 | Low information; patches effectively identical and one confidence was 0.5. | Discount as tie-breaker evidence. |
| `m5-task-005` | revised 3/3 | Low information; patches effectively identical and one confidence was 0.5. | Discount as tie-breaker evidence. |
| `m5-task-007` | old 3/3 | Low information; patches were identical and winner confidence included 0. | Do not treat as real revised failure. |
| `m5-task-008` | old 3/3 | Strong signal; old proved injected timer still invoked `notify`. | Blocking diagnostic before skill changes. |
| `m5-task-010` | old 3/3 | Mostly tie-breaker; implementations equivalent. | Low priority unless M8 needs a negative control. |
| `m5-task-011` | revised 3/3 | Strong signal; CLI-boundary filtering beat helper API expansion. | Preserve this behavior. |
| `m5-task-012` | revised 3/3 | Positive canary preserved, though one confidence was 1.5. | Preserve wrapper-collapse wording. |

## Gate Policy

Keep the LOC gate hard for graduation.

M7 failed because revised median LOC was 18 versus old skill 17.5 while median
expected rework stayed 0 for both arms. That is a narrow miss, but relaxing it
now would move the goalpost after seeing the result.

For M8 diagnostics, report two layers:

| Layer | Purpose | Rule |
| --- | --- | --- |
| Diagnostic signal | Understand whether wording helps reviewer preference. | Allow LOC warnings, but do not call them pass. |
| Graduation signal | Claim Bald Patch improves patch quality. | LOC must not worsen unless reviewer rework or underbuild risk improves. |

## Proposed M8 Scope

M8 should be small and discriminating:

1. Analyze `m5-task-008` diffs directly and identify the exact proof shape that
   reviewers preferred.
2. Mark M7 tasks as strong signal, weak tie-breaker, or non-signal before using
   them in any aggregate gate.
3. Draft an M8 diagnostic design with at most six tasks:
   `m5-task-002`, `m5-task-003`, `m5-task-004`, `m5-task-005`,
   `m5-task-008`, and `m5-task-011`.
4. Include a confidence-adjusted readout alongside raw votes.
5. Preserve the strict graduation gates separately from diagnostic gates.

## Acceptance For M8 Planning

M8 planning is complete when:

- The injected-timer proof requirement is stated as a testable behavior, not a
  stylistic preference.
- Low-information wins are excluded or clearly discounted in the primary gate.
- The design says whether it is testing a skill wording change, a prompt-only
  canary, or only re-scoring existing M7 evidence.
- The README still says Bald Patch is advisory and not automation-ready.

## Recommendation

Open the next work item as M8 diagnostic design, not M8 execution. The design
should decide whether a tiny timer-proof wording change is worth testing; it
should not bundle unrelated validation, form, output, or wrapper changes.

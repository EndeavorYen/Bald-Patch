# M5 Holdout Design

M5 tests whether the provisional reviewer-proof `$baldpatch-patch` update
generalizes beyond the six M4 known-failure tasks. M4 is positive but mixed
canary evidence, not final proof.

## Goal

Answer this question:

> Does the provisional skill improve reviewer preference and expected rework
> without raising correctness, underbuild, LOC, or tool-call risk on holdout
> tasks?

## Experimental Arms

Use four arms:

| Arm | Purpose |
| --- | --- |
| old skill | Same-day reference for the pre-M5 `$baldpatch-patch` text. |
| provisional skill | Tests the M4-informed reviewer-proof wording. |
| natural-baseline | Measures ordinary agent behavior without Bald Patch. |
| prompt-control | Measures generic anti-overbuild prompt hygiene. |

The old skill arm should use a snapshot of the skill before the provisional M5
edit, not a stale historical artifact.

## Task Suite

Run 12-18 tasks. At least half holdout tasks must not have been used to derive
the M4 rules.

Include both positive and negative cases for each rule:

| Rule area | Positive case | Downside case |
| --- | --- | --- |
| helper extraction | Tiny branch where a public behavior test is enough. | Repeated logic where helper extraction is justified. |
| timer proof | Debounce or timeout behavior where scoped deterministic timer proof is available. | Behavior where fake timers would obscure real integration timing. |
| validation boundaries | Pragmatic email or identifier validation with clear accepted/rejected boundary. | Validation where a compact regex would underbuild security or compatibility. |
| form defaults | Add a field to form state with existing default serialization. | Add a field where there is no default-state API to prove. |
| output labels | User-facing dry-run or summary output where new data needs a semantic label. | Terse CLI output where extra labels would be noisy or incompatible. |
| wrapper preservation | Shared helper introduced under existing wrapper functions. | Wrapper collapse explicitly requested or clearly reduces duplicate public surface. |

## Primary Gates

M5 should pass only if the provisional skill satisfies all primary gates:

- Correctness is not worse than old skill, natural-baseline, or prompt-control.
- Pairwise reviewer preference beats old skill and prompt-control.
- Reviewer preference is competitive with or better than natural-baseline.
- Median expected rework is not worse than any control arm.
- Underbuild findings are not higher than any control arm.
- Median LOC is not higher than old skill unless reviewer rework decreases.
- Median tool calls are no more than 15% above old skill.
- No holdout task has a unanimous reviewer loss caused by rule overfitting.

## Review Packet

Use blind review with at least three reviewers. The primary packet should include
pairwise comparisons:

- provisional skill vs old skill
- provisional skill vs prompt-control
- provisional skill vs natural-baseline for tasks where the baseline is the
  historical or same-day winner

Reviewers should report preferred patch, confidence, expected rework minutes,
overbuild risk, underbuild risk, dependency judgment, abstraction judgment, and
short reasoning.

## Approval Boundary

Do not run external M5 model work without explicit approval. Fixture code,
prompts, diffs, and reviewer packets may be sent to external Codex/OpenAI
services only after that approval is recorded for M5.

## Decision

If M5 passes, update README from "positive but mixed M4 evidence" to reviewed
M5 evidence and consider broader automation only as a separate issue.

If M5 fails, keep Bald Patch as a docs-first advisory skill, preserve the M5
failure analysis, and do not add hooks, plugins, or stronger automation.

# Bald Patch M3 Smoke Failure Analysis - 2026-06-18

## Verdict

The M3 reviewer-trust guidance did not improve Bald Patch reviewer preference.
It reduced tool calls, but it did not produce smaller or more reviewable patches.

Aggregate evidence from `2026-06-18-m3-smoke-reviewed`:

| Arm | Success | Median LOC | Tool calls | Reviewer preference | Median rework | Underbuild findings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| baldpatch-skill | 6/6 | 23.5 | 10 | 11% | 0 | 1 |
| natural-baseline | 6/6 | 20.5 | 14.5 | 50% | 0 | 0 |
| prompt-control | 6/6 | 21.5 | 13.5 | 39% | 0 | 1 |

Compared with the targeted M2 tasks, the M3 guidance produced only partial
movement:

| Task | M2 winner | M2 skill votes | M3 winner | M3 skill votes | Readout |
| --- | --- | ---: | --- | ---: | --- |
| task-001 | natural-baseline | 0/3 | prompt-control | 0/3 | no improvement |
| task-002 | natural-baseline | 0/3 | prompt-control | 1/3 | partial timer-test improvement |
| task-003 | natural-baseline | 0/3 | natural-baseline | 0/3 | no improvement |
| task-005 | natural-baseline | 0/3 | natural-baseline | 0/3 | no improvement |
| task-008 | natural-baseline | 0/3 | natural-baseline | 0/3 | no improvement |
| task-011 | prompt-control | 0/3 | prompt-control | 1/3 | partial helper improvement |

## Task-Level Findings

### task-001: CLI JSON flag

Winner: `prompt-control` with 3/3 votes.

The skill patch added and exported a `formatJson` helper solely to support a
simple `JSON.stringify` branch. Reviewers accepted it, but all three marked the
abstraction as avoidable and preferred the direct implementation.

Failure mode: reviewer-trust guidance pushed the agent toward extra testable
surface instead of the smallest clear production path.

Rule implication: do not add or export helpers just to make a tiny behavior
testable. Test through the existing public entry point when that is enough.

### task-002: debounce behavior

Winner: `prompt-control` with 2/3 votes. Bald Patch received 1/3.

Both winning and skill patches used deterministic timer tests. The skill patch
used a module-level `mock` import plus `try/finally` cleanup; the winner used
the node:test context timer mock. The skill patch was correct and got one vote,
but reviewers preferred the smaller scoped test in two reviews.

Failure mode: the instruction "prefer deterministic timer tests" helped, but it
did not distinguish minimal scoped fake timers from extra cleanup ceremony.

Rule implication: prefer the narrowest deterministic timer mechanism already
provided by the test context. Extra cleanup code is not reviewer value when the
framework scopes the mock.

### task-003: signup email validation

Winner: `natural-baseline` with 3/3 votes.

The skill patch was shorter than the winner, but reviewers considered it weaker
validation. It missed the stronger domain/TLD boundary used by the winning
patch and had less convincing obvious-invalid coverage. One reviewer marked the
skill patch underbuilt.

Failure mode: "pragmatic validation" became too loose. The patch stayed small
but left reviewer doubt around malformed domains.

Rule implication: validation tasks need an explicit boundary of accepted common
formats and rejected obvious malformed formats. Smaller regex is not enough if
reviewers cannot see the boundary.

### task-005: due-date form state

Winner: `natural-baseline` with 3/3 votes.

All arms made the same production change. The skill patch was the smallest, but
reviewers preferred the baseline test evidence because it covered due-date-only
state and default serialization with `serializeTaskForm()`.

Failure mode: the skill patch proved the happy path but did not prove the default
state path reviewers valued.

Rule implication: when adding a field to existing form state, the preserved
default behavior is part of the requested behavior. Test both populated field
state and default serialization if the existing API exposes defaults.

### task-008: dry-run output

Winner: `natural-baseline` with 3/3 votes.

The skill patch had the same LOC as the winner and fewer tool calls, but output
only listed paths after `Dry run complete.`. The winner added an explicit
`Would modify:` heading. Reviewers preferred the patch that made the path
semantics obvious.

Failure mode: the patch satisfied "prints paths" but under-served "explicit".

Rule implication: for user-facing script output, include the minimum wording
that explains what new data means. A raw path list can be too terse even when it
is technically correct.

### task-011: shared format helper

Winner: `prompt-control` with 2/3 votes. Bald Patch received 1/3.

All arms introduced the same `formatAmount` helper. The skill patch changed
`invoiceSummary` and `receiptSummary` to call the helper directly, bypassing the
existing `formatInvoiceTotal` and `formatReceiptTotal` wrapper path. Reviewers
preferred the prompt-control patch that centralized formatting while preserving
the existing summary-to-wrapper call graph.

Failure mode: "use the shared helper" was over-applied to call sites where the
existing wrapper was already the right integration point.

Rule implication: when introducing a helper, preserve existing wrapper functions
and call paths unless the request explicitly asks to collapse them.

## Cross-Cutting Diagnosis

The current M3 guidance is directionally correct but too coarse. It tells the
agent to add reviewer-valued proof, but it does not define the reviewer-valued
shape of proof.

Observed anti-patterns:

- Extra helper/export surface for tiny behavior.
- Deterministic tests with avoidable ceremony.
- Validation that is smaller but too loose at reviewer-visible boundaries.
- Happy-path field tests that miss default state preservation.
- Output that lists data without enough semantic labeling.
- Shared-helper integration that bypasses existing wrapper call paths.

The main durable benefit remains lower tool calls. That suggests the skill helps
agents converge faster, but it does not yet steer them toward the patches
reviewers prefer.

## Recommended Next Experiment

Do not add more generic "write tests" guidance. The next iteration should test a
more specific reviewer-proof rubric:

1. Do not add or export a helper solely for a tiny branch; prefer testing the
   existing public behavior.
2. Prefer scoped deterministic timer facilities over global mock setup when
   available.
3. For validators, name and test the accepted/rejected boundary before choosing
   the implementation.
4. For stateful form additions, test both populated field state and default
   state preservation.
5. For user-facing output, include minimal semantic labels that explain new
   data.
6. For shared helpers, preserve existing wrapper call paths unless removing them
   is explicitly requested.

Before changing the skill, add a small M4 canary plan focused on these six
specific failure modes. The success condition should be task-level reviewer
preference movement, not aggregate LOC reduction alone.

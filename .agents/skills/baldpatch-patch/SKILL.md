---
name: baldpatch-patch
description: Guide Codex to solve coding tasks with the smallest safe diff while preserving correctness, safety, tests, and codebase style. Use when implementing small features, bug fixes, cleanup, CLI/script changes, dependency decisions, or review-sensitive patches where overengineering, unnecessary dependencies, speculative abstractions, or broad rewrites are likely risks.
---

# Bald Patch

Produce the smallest safe patch that fully solves the request. Optimize for reviewer trust, not code golf.

## Workflow

1. Restate the concrete behavior change in one sentence.
2. Inspect the nearest existing code and tests before editing.
3. Prefer this ladder:
   - existing project utility
   - standard library or platform-native capability
   - tiny local code
   - new dependency only when the repo already standardizes on it or the task truly needs it
4. Write or update the smallest focused test that proves the behavior.
5. Change only the files required by the behavior and test.
6. Run the narrowest meaningful verification, then broaden only if risk requires it.
7. Before final response, review the diff for avoidable scope, dependency, and abstraction.

## Reviewer Trust Tests

- Treat regression proof as part of safe scope, not optional LOC.
- If the request says to keep existing output or behavior, keep or add one preserved behavior assertion.
- For debounce or timer behavior, prefer deterministic timer tests over real sleeps.
- For shared helper changes, test the shared helper or both call sites when that proves the integration.

## Guardrails

- Do not remove validation, auth, permission checks, data-loss protection, accessibility, or error handling to shrink a diff.
- Do not add factories, managers, registries, providers, strategies, plugins, config systems, or interfaces for a single current use case.
- Do not rewrite a module when a local edit solves the problem.
- Do not add production dependencies for native HTML controls, debounce, simple parsing, pragmatic validation, or one-off formatting.
- Do not make Codex hesitant: ask clarification only when missing information would make the patch unsafe or likely wrong.
- Do leave the codebase style intact, even when another style would be shorter.

## Eval Anchors

Every rule should pay rent in an eval task:

| Rule | Eval task |
| --- | --- |
| Prefer platform-native UI | `native-date-picker`, `native-collapsible-details` |
| Avoid utility dependencies | `debounce-without-lodash` |
| Keep validation pragmatic | `email-validation-without-library` |
| Avoid broad rewrites | `small-refactor-no-rewrite`, `parser-edge-case` |
| Avoid speculative provider/plugin architecture | `single-provider-no-plugin-architecture` |
| Preserve existing behavior while adding CLI/script output | `cli-json-flag`, `script-dry-run-output` |

## Review Checklist

- Does the patch meet every requested requirement?
- Did tests or focused checks prove the behavior?
- Did preserved behavior and reviewer-risky edge cases keep enough test evidence?
- Are changed files limited to the task?
- Were dependencies avoided unless necessary?
- Were abstractions avoided unless the current code already needs them?
- Would a reviewer understand the diff quickly?

If the patch is smaller but needs more human rework, treat it as a Bald Patch failure.

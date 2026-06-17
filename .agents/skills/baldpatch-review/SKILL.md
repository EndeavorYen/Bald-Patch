---
name: baldpatch-review
description: Audit a code patch for Bald Patch risks without acting as the sole judge. Use when reviewing a diff, preparing a PR, checking for overengineering, or validating whether a Bald Patch-guided change avoided unnecessary dependencies, speculative abstractions, unrelated rewrites, missing tests, and safety-sensitive deletions.
---

# Bald Patch Review

Run an advisory overbuild audit on the current patch. Treat findings as reviewer prompts, not automatic failures.

## Workflow

1. Inspect the user request, touched files, and diff.
2. Run deterministic review evidence:

```bash
node scripts/baldpatch-review.mjs --base main
```

3. Read the generated findings.
4. Verify each finding against the actual code before reporting it.
5. Separate hard risks from style preferences.
6. Recommend the smallest correction that preserves correctness and codebase style.

## Report

Lead with actionable findings:

- avoidable dependency or lockfile churn
- speculative abstraction such as Manager, Registry, Provider, Strategy, Plugin, or Factory
- broad rewrite where a local edit would solve the task
- source change without a focused test change
- deletion of validation, auth, permission, sanitization, rollback, or data-loss protection

Then say what evidence was checked and what remains uncertain.

## Boundaries

- Do not score the patch solely by LOC.
- Do not block a patch only because `scope-lint` warned.
- Do not ask for broad refactors as a review fix.
- Do not treat the automated review as a substitute for human review.

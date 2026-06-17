# Bald Patch Installation

Bald Patch ships as a docs-first, repo-scoped workflow until the M1 smoke eval shows human value. There is no marketplace/plugin packaging claim yet.

## Repo-Scoped Use

Inside this repository, Codex can discover:

- `.agents/skills/baldpatch-patch/SKILL.md`
- `.agents/skills/baldpatch-review/SKILL.md`

Use explicit invocation:

```text
$baldpatch-patch Fix the parser edge case with the smallest safe diff.
$baldpatch-review Audit this patch for avoidable overengineering.
```

## Local Personal Install

For local experimentation in another repo, copy or symlink the skill folders into your user skills directory:

```bash
mkdir -p "$HOME/.agents/skills"
cp -R .agents/skills/baldpatch-patch "$HOME/.agents/skills/"
cp -R .agents/skills/baldpatch-review "$HOME/.agents/skills/"
```

Restart Codex if the skills do not appear immediately.

## Optional Stop Hook

The Stop hook is opt-in and non-blocking:

```bash
node scripts/stop-hook-metrics.mjs
```

See [hooks.md](hooks.md) for a project hook snippet and the exact JSON behavior.

## Packaging Gate

Broader packaging should wait until a real M1 report exists under `evals/reports/` and shows:

- correctness not worse than baseline
- median LOC changed down 20% or more
- unnecessary dependency additions down 50% or more
- median tool calls up no more than 15%
- blind reviewer preference 60% or more for Bald Patch

Until those gates pass, keep Bald Patch explicit and docs-first. Do not introduce an always-on long prompt without measured benefit.

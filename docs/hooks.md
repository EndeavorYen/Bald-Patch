# Bald Patch Hooks

Bald Patch hooks are optional and non-blocking. The first hook is a Stop hook that prints concise patch metrics after a Codex turn. It does not block, continue, or judge the turn.

The hook follows current Codex behavior for Stop hooks: Stop expects JSON on stdout when the command exits 0, and JSON can use common output fields such as `continue` and `systemMessage`. The wrapper always returns `continue: true`.

## Command

```bash
node scripts/stop-hook-metrics.mjs
```

The command reads the hook JSON from stdin, uses `cwd` when present, and emits JSON like:

```json
{"continue":true,"systemMessage":"Bald Patch metrics: 2 files, +12/-4 LOC, deps no, locks no, warnings 1."}
```

If metrics collection fails, the hook still exits 0:

```json
{"continue":true,"systemMessage":"Bald Patch metrics unavailable: git failed"}
```

## Opt-In Config

Add this only if you want turn-end metrics in a Codex environment that supports project hooks:

```toml
[[hooks.Stop.hooks]]
type = "command"
command = 'node "$(git rev-parse --show-toplevel)/scripts/stop-hook-metrics.mjs"'
timeout = 10
statusMessage = "Collecting Bald Patch metrics"
```

Do not enable this hook while running the M1 A/B eval unless the hook is the explicit arm being measured. Otherwise it changes the baseline instruction/tooling surface.

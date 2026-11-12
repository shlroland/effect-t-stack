# Contributing

## Layout

| Path              | Role                                   |
| ----------------- | -------------------------------------- |
| `apps/cli`        | `create-effect-t-stack` (`effect/cli`) |
| `examples/golden` | Golden Sample (SoT for `--yes`)        |
| `docs/`           | Capability Tiers, ADRs, fingerprint    |
| `repos/effect`    | Vendored Effect reference (read-only)  |

Edit the golden first for shared spine changes; L3 templates will sync from it later.

## Prerequisites

- **Bun ≥ 1.4.4** (see root and golden `packageManager` / `engines`)
- Node is not required for the default path; Workers notes land with L3 `--runtime`

## Setup

```sh
bun install
bun install --cwd examples/golden
bun run check
```

## Test tiers (Scaffold)

1. **Contract** — `bun run --filter=@ets/cli test` (parse/rename/denylist; no golden file-text snapshots)
2. **Generated-build** — `ETS_GENERATED_BUILD=1 bun test apps/cli/src/generated-build.smoke.test.ts`
3. **Live** — manual `bun run create -- <name> --yes` then `bun run check` / `dev` in the target (CI gate later)

## Style

- Golden: `effect-style` (dprint + oxlint / `@effect/oxc`)
- CLI: named exports, `.ts` imports, `effect/cli` for argv — no hand-rolled parsers
- Commits: conventional style preferred (`feat(cli): …`, `fix(golden): …`)

## Capability Tiers

Implement **L1 → L6** in order. Do not skip into L5/L6 product surfaces before lower tiers. See `docs/CAPABILITY-TIERS.md`.

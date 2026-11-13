# Contributing

## Layout

| Path                          | Role                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `apps/cli`                    | `create-effect-t-stack` (`effect/cli`) — domain folders + `test/`; see [`apps/cli/README.md`](./apps/cli/README.md) |
| `packages/template-generator` | Handlebars + VFS generator. `create` reads this.                                                                    |
| `packages/effect-oxc`         | Owned copy of unpublished `@effect/oxc`. Generated apps copy it.                                                    |
| `docs/`                       | Capability Tiers, ADRs, fingerprint, compatibility                                                                  |
| `repos/effect`                | Vendored Effect reference (read-only)                                                                               |

Edit a template fragment or a post-processor, then prove it with a generated-build.

## Prerequisites

- **Bun ≥ 1.4.4** (see root `packageManager` / `engines`)
- Node is not required for the default path; Workers notes land with L3 `--runtime`

## Setup

```sh
bun install
bun run check
```

**Agent note:** `bun run check` / `bun run --filter=create-effect-t-stack check` need full workspace module resolution. In Cursor, run them **outside the sandbox** (`required_permissions: ["all"]`); sandboxed runs often false-fail on `@effect/platform-bun` / bun types.

## Test tiers (Scaffold)

1. **Contract** — `bun run --filter=create-effect-t-stack test` and `bun run --filter=@effect-t-stack/template-generator test` (no template-text snapshots)
2. **Generated-build** — `ETS_GENERATED_BUILD=1 bun test packages/template-generator/test/generated-build.test.ts` (install, check-types, lint, dprint) and `ETS_GENERATED_BUILD=1 bun test apps/cli/test/generated-build.smoke.test.ts` (CLI `--yes` then check-types)
3. **Live** — manual `bun run create -- <name> --yes` then `bun run check-types` in the target; CI: Actions workflow **live-smoke** (`workflow_dispatch` / weekly)

## Publishing the CLI

See [`apps/cli/README.md`](./apps/cli/README.md). `prepack` embeds `packages/template-generator` into `apps/cli/templates/template-generator` (gitignored).

## Style

- Golden: `effect-style` (dprint + oxlint / `@effect/oxc`)
- CLI: named exports, `.ts` imports, `effect/cli` for argv — no hand-rolled parsers
- Review judgements: [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)
- Commits: conventional style preferred (`feat(cli): …`, `fix(golden): …`)

## Capability Tiers

**L0–L2 closed.** Implement **L3 → L6** in order. Do not skip into L5/L6 product surfaces before lower tiers. See `docs/CAPABILITY-TIERS.md`.

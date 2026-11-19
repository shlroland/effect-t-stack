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

- **Bun ≥ 1.4.4** for Scaffold Product development / `bun run check` (see root `packageManager`)
- **Node ≥ 24** (Active LTS) for the published CLI (`npx` / `pnpm dlx`). Generated default apps still target Bun runtime until a later runtime matrix lands

### Optional: Nix flake

Root [`flake.nix`](./flake.nix) (Effect-style) pins a reproducible shell: Bun, Node LTS (`nodejs_24`), pnpm, yarn, git. Not required if those tools are already on PATH. Generated apps include the same `flake` addon by default. The flake input is `nixpkgs-26.05-darwin` so Intel Macs (`x86_64-darwin`) still work; `nixpkgs-unstable` 26.11 dropped that platform.

```sh
# Enable flakes once (user config; not in this repo):
#   mkdir -p ~/.config/nix
#   echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf
# fish: ensure the multi-user Nix profile is on PATH
nix develop                 # enter the shell (first run downloads nixpkgs from flake.lock)
nix develop -c $SHELL       # keep fish/zsh

bun install
bun run check
```

Optional direnv: add a local `.envrc` with `use flake` (and `direnv allow`). Do not commit `.direnv/`.

## Setup

```sh
bun install
bun run check
```

**Agent note:** `bun run check` / `bun run --filter=create-effect-t-stack check` need full workspace module resolution. In Cursor, run them **outside the sandbox** (`required_permissions: ["all"]`); sandboxed runs often false-fail on `@effect/platform-bun` / bun types.

## Test tiers (Scaffold)

1. **Contract** — `bun run --filter=create-effect-t-stack test` and `bun run --filter=@effect-t-stack/template-generator test` (no template-text snapshots)
2. **Generated-build** — `ETS_GENERATED_BUILD=1 bun test packages/template-generator/test/generated-build.test.ts` (rpc default + `api=httpapi` + `database=postgres` + `auth=better-auth` + `packageManager=npm|pnpm` when those binaries are on PATH; install, check-types, lint) and `ETS_GENERATED_BUILD=1 bun test apps/cli/test/generated-build.smoke.test.ts` (CLI `--yes`, `--api httpapi`, `--database postgres`, `--auth better-auth` then check-types). npm/pnpm samples skip cleanly if the binary is missing; while `runtime=bun`, workspace `test` scripts still need Bun on PATH.
3. **Live** — manual `bun run create -- <name> --yes` then `bun run check-types` in the target; CI: Actions workflow **live-smoke** (`workflow_dispatch` / weekly)

## Publishing the CLI

See [`apps/cli/README.md`](./apps/cli/README.md) **Publish**. First cut is **manual** `npm publish`; later cuts are tag-driven CI (`.github/workflows/publish.yml` + npm Trusted Publisher / OIDC). `prepack` embeds `packages/template-generator` into `apps/cli/templates/template-generator` (gitignored).

## Style

- Golden: `effect-style` (dprint + oxlint / `@effect/oxc`)
- CLI: named exports, `.ts` imports, `effect/cli` for argv — no hand-rolled parsers
- Review judgements: [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)
- Commits: conventional style preferred (`feat(cli): …`, `fix(golden): …`)

## Capability Tiers

**L0–L2 closed.** Implement **L3 → L6** in order. Do not skip into L5/L6 product surfaces before lower tiers. See `docs/CAPABILITY-TIERS.md`.

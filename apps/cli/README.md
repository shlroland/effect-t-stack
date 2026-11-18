# create-effect-t-stack

Scaffold an Effect **v4** app by generating it from `packages/template-generator` (scope `@<name>/*`).

## Requirements

- **Node ≥ 24** (Active LTS) for the published CLI (`npx` / `pnpm dlx` / `bunx`) — `prepack` emits a Node ESM bundle under `dist/`
- **Bun ≥ 1.4.4** for Scaffold Product development (D3). `bin.ts` uses BunServices when `globalThis.Bun` is set, otherwise NodeServices
- Default generate includes addon `flake` (`flake.nix` for `nix develop`)

## Source layout

| Path                                                 | Role                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/bin.ts` · `src/Cli.ts` · `src/normalizeArgv.ts` | Entrypoint / root command / bare-argv UX                                   |
| `src/create/`                                        | `create` pipeline, flags, generator load, PM version stamp                 |
| `src/add/`                                           | `add` addon + `--package`                                                  |
| `src/agent/`                                         | `create-json` / `add-json` / `schema` / `history`                          |
| `src/compatibility/`                                 | Illegal-combo engine + catalog (L2+)                                       |
| `src/fingerprint/`                                   | `ets.jsonc` parse/stamp/history helpers                                    |
| `src/template/`                                      | Denylist, paths, rename, project name                                      |
| `src/shared/`                                        | Shared tagged errors                                                       |
| `test/`                                              | **All** CLI tests (`bun test ./test`) — never put `*.test.ts` under `src/` |
| `schemas/`                                           | Fingerprint JSON Schema                                                    |
| `scripts/`                                           | `pack:generator` (prepack), layout asserts                                 |

`check` runs `assert:test-layout` so `src/**/*.test.ts` fails the build.

## Usage

```sh
npx create-effect-t-stack@latest my-app --yes
pnpm dlx create-effect-t-stack@latest my-app --yes
bunx create-effect-t-stack@latest my-app --yes
# publishable Effect library (no apps/db):
bunx create-effect-t-stack@latest my-lib --yes --template library
# equivalent explicit subcommand:
npx create-effect-t-stack@latest create my-app --yes
# from a Scaffold Product checkout (Bun):
bun run create -- my-app --yes
bun run create -- my-lib --yes --template library

# L2
bunx create-effect-t-stack add --package billing
bunx create-effect-t-stack schema --name fingerprint
bunx create-effect-t-stack history --json
```

Notable create flags: `--template default|library`, `--dry-run`, `--verbose`, `--package-manager bun|npm|pnpm`, `--directory-conflict`, `--open <bin>`, `--manual-db`.

Illegal combinations are rejected by the compatibility engine (`docs/compatibility.md`). `--template library` scaffolds a publishable Effect package (`src/` + effect-style); it rejects `--auth better-auth` and non-default `--api`/`--database`/`--manual-db`. `--api httpapi` flips Todo UI to AtomHttpApi (Rpc stays secondary). `--database postgres` switches Drizzle to `effect-postgres` + `@effect/sql-pg` (default remains sqlite). `--auth better-auth` adds `@auth` + Better Auth HTTP at `/api/auth` ([ADR-0008](../../docs/adr/0008-auth-better-auth-official-effect-http.md)). `--no-effect-style` stays gated until that L3 cell lands.

## Local check (agents)

```sh
bun run --filter=create-effect-t-stack check
```

Needs a full Bun workspace install. In Cursor, run this **outside the sandbox** (`required_permissions: ["all"]`); sandboxed runs often false-red on missing `@effect/platform-bun` / bun types.

## Publish (maintainers)

`prepack` runs `pack:generator`: it prebuilds templates and copies `packages/template-generator` into `templates/template-generator` (gitignored). The packed CLI loads that copy when the workspace package is not installed.

### 1. First publish (manual — required once)

npm **Trusted Publishing** can only be configured after the package exists on the registry. Do the first cut locally:

```sh
bun install
bun run --filter=create-effect-t-stack check
bun run pack:cli                 # inspect the tarball
cd apps/cli
# ensure "version" in package.json is what you want (e.g. 0.1.0)
npm login
npm publish --access public
```

Then on [npmjs.com → create-effect-t-stack → Settings → Trusted Publisher](https://www.npmjs.com/package/create-effect-t-stack):

| Field                | Value                         |
| -------------------- | ----------------------------- |
| Provider             | GitHub Actions                |
| Organization or user | `shlroland`                   |
| Repository           | `effect-t-stack`              |
| Workflow filename    | `publish.yml` (filename only) |
| Allowed actions      | allow **npm publish**         |

Complete the **first OIDC publish within 2 days** of saving that config (npm expires unused trusted-publisher rows). Prefer bumping to `0.1.1` (or next), tagging, and letting CI publish — do not re-publish the same version.

### 2. Later publishes (GitHub Actions)

Workflow: [`.github/workflows/publish.yml`](../../.github/workflows/publish.yml). Trigger: push tag `v*` whose name matches `apps/cli/package.json` `version` (e.g. tag `v0.1.1` ↔ `"version": "0.1.1"`).

```sh
# on main, after bumping apps/cli/package.json "version"
git add apps/cli/package.json
git commit -m "chore(cli): release v0.1.1"
git tag v0.1.1
git push origin main --tags
```

CI runs `bun run check`, packs via `prepack`, then `npm publish --access public` with OIDC (no `NPM_TOKEN`). Optional dry-run: Actions → **publish** → Run workflow → keep `dry_run` checked.

# create-effect-t-stack

Scaffold an Effect **v4** app by whole-tree copying the [effect-t-stack](https://github.com/shlroland/effect-t-stack) Golden Sample (`@ets/*` → `@<name>/*`).

## Requirements

- **Bun ≥ 1.4.4**

## Source layout

| Path                                                 | Role                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/bin.ts` · `src/Cli.ts` · `src/normalizeArgv.ts` | Entrypoint / root command / bare-argv UX                                 |
| `src/create/`                                        | `create` pipeline, flags, copy/rename, PM artifacts                      |
| `src/add/`                                           | `add` addon + `--package`                                                |
| `src/agent/`                                         | `create-json` / `add-json` / `schema` / `history`                        |
| `src/compatibility/`                                 | Illegal-combo engine + catalog (L2+)                                     |
| `src/fingerprint/`                                   | `ets.jsonc` parse/stamp/history helpers                                  |
| `src/template/`                                      | Denylist, paths, rename, project name                                    |
| `src/shared/`                                        | Shared tagged errors                                                     |
| `test/`                                              | **All** CLI tests (`bun test test`) — never put `*.test.ts` under `src/` |
| `schemas/`                                           | Fingerprint JSON Schema                                                  |
| `scripts/`                                           | `pack:golden`, layout asserts                                            |

`check` runs `assert:test-layout` so `src/**/*.test.ts` fails the build.

## Usage

```sh
bunx create-effect-t-stack@latest my-app --yes
# equivalent explicit subcommand:
bunx create-effect-t-stack@latest create my-app --yes
# from a Scaffold Product checkout:
bun run create -- my-app --yes

# L2
bunx create-effect-t-stack add --package billing
bunx create-effect-t-stack schema --name fingerprint
bunx create-effect-t-stack history --json
```

Notable create flags: `--dry-run`, `--verbose`, `--package-manager bun|npm|pnpm`, `--directory-conflict`, `--open <bin>`, `--manual-db`.

Illegal combinations are rejected by the compatibility engine (`docs/compatibility.md`); `--api httpapi` / `--no-effect-style` stay gated until L3.

## Local check (agents)

```sh
bun run --filter=create-effect-t-stack check
```

Needs a full Bun workspace install. In Cursor, run this **outside the sandbox** (`required_permissions: ["all"]`); sandboxed runs often false-red on missing `@effect/platform-bun` / bun types.

## Publish (maintainers)

From the repo root:

```sh
bun install
bun run --filter=create-effect-t-stack pack:golden
cd apps/cli && bun pm pack   # inspect tarball
npm publish --access public  # requires npm auth; bumps version first
```

`prepack` embeds `examples/golden` into `templates/golden` (denylist applied). Do not commit `templates/golden`.

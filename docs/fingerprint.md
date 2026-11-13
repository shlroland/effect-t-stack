# How to read `ets.jsonc`

Generated-app **fingerprint**. `create` writes `ets.jsonc` from `packages/template-generator`. Agents and `create-effect-t-stack` use it to recognize the stack. Schema bumps need a short note (ADR or this folder) and CLI awareness of N / N-1 — see [ADR-0005](./adr/0005-l0-exit-and-fingerprint-hygiene.md).

## Field classes

| Class              | Examples                                                               | Rules                                                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stack dims**     | `runtime`, `api`, `orm`, `auth`, `frontend`, `backend`, `env`          | Root Option Matrix; prefer nested `*Options` over new root keys. `api` primary binding: [ADR-0006](./adr/0006-api-primary-rpc-with-httpapi-secondary.md)                    |
| **`addons[]`**     | `turborepo`, `effect-style`, `mcp`                                     | Ordered list of enabled addons                                                                                                                                              |
| **`addonOptions`** | `addonOptions.effect-style`                                            | Per-addon details; nest here instead of inventing root keys                                                                                                                 |
| **Meta**           | `$schema`, `version`, `createdAt`, `reproducibleCommand`, `cliVersion` | The generator writes create-time meta when a CLI version is passed. `version` = **schema** version; `cliVersion` = CLI release. Schema: `apps/cli/schemas/ets.schema.json` |

## Template-owned paths

| Kind                       | Meaning                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default templates**      | Fragments in `packages/template-generator/templates` for the default stack. Edit the fragment, then prove with a generated-build.                             |
| **Template-only overlays** | Fragments that exist only for non-default Option Matrix cells (other runtime/db/auth/frontend). No second sample monorepo; prove with generated-builds.       |

`create` generates from those templates. It does not copy a sample tree.

## Write path

- The generator writes the fingerprint; `add` updates addon entries
- Agents must not invent ad-hoc top-level keys
- Shared dependency pins live in `dependencyVersionMap` — see [DEPENDENCY-CATALOG.md](./DEPENDENCY-CATALOG.md)
- Keep `ets.jsonc` so `add` can evolve the app; safe to delete only if you abandon the CLI
- **Upgrade policy:** no scaffold `migrate`/codemods — use `add` for additive changes; dependency bumps are user/Dependabot/catalog-driven

## CLI commands (L2)

| Command                    | Role                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `create` / bare `my-app`   | Generate from templates and write `ets.jsonc`                                                       |
| `add <addon>`              | Ensure a default addon is in the fingerprint (file overlays for new addons are backlog)            |
| `add --package <name>`     | Scaffold `packages/<name>` + record under `addonOptions.packages`                                  |
| `create-json` / `add-json` | Agent stdin/stdout JSON contracts                                                                  |
| `schema --name …`          | Emit JSON Schema documents                                                                         |
| `history`                  | Local-only JSONL at `~/.config/create-effect-t-stack/history.jsonl` (override: `ETS_HISTORY_PATH`) |

Illegal create/add combinations and agent validation order: [compatibility.md](./compatibility.md).

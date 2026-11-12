# How to read `ets.jsonc`

Golden Sample / generated-app **fingerprint** (canonical file: [`examples/golden/ets.jsonc`](../examples/golden/ets.jsonc)). Agents and `create-effect-t-stack` use it to recognize the stack. Schema bumps need a short note (ADR or this folder) and CLI awareness of N / N-1 — see [ADR-0005](./adr/0005-l0-exit-and-fingerprint-hygiene.md).

## Field classes

| Class              | Examples                                                               | Rules                                                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stack dims**     | `runtime`, `api`, `orm`, `auth`, `frontend`, `backend`, `env`          | Root Option Matrix; prefer nested `*Options` over new root keys. `api` primary binding: [ADR-0006](./adr/0006-api-primary-rpc-with-httpapi-secondary.md)                    |
| **`addons[]`**     | `turborepo`, `effect-style`, `mcp`                                     | Ordered list of enabled addons                                                                                                                                              |
| **`addonOptions`** | `addonOptions.effect-style`                                            | Per-addon details; nest here instead of inventing root keys                                                                                                                 |
| **Meta**           | `$schema`, `version`, `createdAt`, `reproducibleCommand`, `cliVersion` | Golden may omit create-time meta; CLI stamps them on generate/`add`. `version` = **schema** version; `cliVersion` = CLI release. Schema: `apps/cli/schemas/ets.schema.json` |

## Golden-owned vs template-only (L3 preview)

| Kind                       | Meaning                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Golden-owned**           | Paths that exist in `examples/golden` and define the default Effect Core spine. Edit golden first; L3 sync regenerates overlapping `.hbs`.                    |
| **Template-only overlays** | Files/fragments that exist only for non-default Option Matrix cells (other runtime/db/auth/frontend). No second golden monorepo; prove with generated-builds. |

L1 thin MVP only whole-tree-copies golden (no `.hbs` yet).

## Write path

- Only CLI/`add` (and documented manual golden edits) mutate the fingerprint
- Agents must not invent ad-hoc top-level keys
- Shared dependency pins live in `examples/golden/package.json` `workspaces.catalog` — see [DEPENDENCY-CATALOG.md](./DEPENDENCY-CATALOG.md)
- Keep `ets.jsonc` so `add` can evolve the app; safe to delete only if you abandon the CLI
- **Upgrade policy:** no scaffold `migrate`/codemods — use `add` for additive changes; dependency bumps are user/Dependabot/catalog-driven

## CLI commands (L2)

| Command                    | Role                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `create` / bare `my-app`   | Whole-tree golden copy + stamp meta                                                                |
| `add <addon>`              | Ensure Golden addon in fingerprint (file overlays for new addons → L3)                             |
| `add --package <name>`     | Scaffold `packages/<name>` + record under `addonOptions.packages`                                  |
| `create-json` / `add-json` | Agent stdin/stdout JSON contracts                                                                  |
| `schema --name …`          | Emit JSON Schema documents                                                                         |
| `history`                  | Local-only JSONL at `~/.config/create-effect-t-stack/history.jsonl` (override: `ETS_HISTORY_PATH`) |

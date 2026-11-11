# How to read `ets.jsonc`

Golden Sample / generated-app **fingerprint**. Agents and future `create-effect-t-stack` use it to recognize the stack. Schema bumps need a short note (ADR or this folder) and CLI awareness of N / N-1 — see [ADR-0005](./adr/0005-l0-exit-and-fingerprint-hygiene.md).

## Field classes

| Class              | Examples                                                      | Rules                                                                         |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Stack dims**     | `runtime`, `api`, `orm`, `auth`, `frontend`, `backend`, `env` | Root Option Matrix; prefer nested `*Options` over new root keys               |
| **`addons[]`**     | `turborepo`, `effect-style`, `mcp`                            | Ordered list of enabled addons                                                |
| **`addonOptions`** | `addonOptions.effect-style`                                   | Per-addon details; nest here instead of inventing root keys                   |
| **Meta**           | `version`, `createdAt`, `reproducibleCommand`, `cliVersion`   | Golden may omit create-time meta; generated apps include them once CLI exists |

## Write path

- Only CLI/`add` (and documented manual golden edits) mutate the fingerprint
- Agents must not invent ad-hoc top-level keys
- Shared dependency pins live in root `package.json` `workspaces.catalog` — see [DEPENDENCY-CATALOG.md](./DEPENDENCY-CATALOG.md)

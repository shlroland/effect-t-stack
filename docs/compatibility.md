# Compatibility engine (L2)

`create-effect-t-stack` rejects illegal create/add combinations **before** copying or rewriting `ets.jsonc`. Source of truth for rule ids / messages: [`apps/cli/src/compatibility/catalog.ts`](../apps/cli/src/compatibility/catalog.ts).

## Validation order (agents)

Always apply stages in this order:

1. **enums** — values must be in the declared literal sets (`packageManager`, `api`, `directoryConflict`, …). CLI `Flag.Literals` enforces most of this at parse time; `create-json` still runs the same stage.
2. **combinations** — Option Matrix cell rules (e.g. `api=httpapi` primary flip waits for L3; future `database=none`+`drizzle`).
3. **auth/addons** — auth × backend/DB (deferred), payments ⇒ better-auth (deferred), default-addon allowlist, `effect-style` conflicts, `add` package↔addon mutex. `effect-style` does not require the `repos` checkout.
4. **examples** — deferred to L3 (`--examples`).

Stop at the first failing active rule. Deferred catalog entries are documentation for agents — they are **not** enforced until the matching CLI flags / templates land (L3+).

## Active illegal / gated combos (L2)

| Rule id                                  | When                                                                |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `create.enums.*`                         | Unknown enum on create / create-json                                |
| `create.combinations.api.rpc-only`       | `--api httpapi` (plumbing only until L3)                            |
| `create.addons.effect-style.required`    | `--no-effect-style` (omit path until L3)                            |
| `add.addons.default-only`                | `add <addon>` outside the default addon set                         |
| `add.addons.effect-style.conflicts`      | `effect-style` with `biome` / `ultracite` / `oxlint-only` / `husky` |
| `add.mutex.package-or-addon`             | CLI or `add-json` passes both package and addon                     |

Default addons: `turborepo`, `skills`, `repos`, `language-service`, `mcp`, `effect-style`.

`add.addons.effect-style.requires-repos` is deferred: lint loads `packages/effect-oxc`, so `repos` is optional reference source.

## Deferred (catalog only — L3 Option Matrix)

Examples mirrored in the catalog with `status: "deferred"`:

- `database=none` + drizzle/prisma/mongoose
- `frontend=none` (API-only)
- No backend / no DB ⇒ force `auth=none`
- `payments=polar` without `better-auth`
- Full `--examples` matrix

See [CAPABILITY-TIERS.md](./CAPABILITY-TIERS.md) L3 for the full surface.

## Upgrade policy

Unchanged: no scaffold `migrate`/codemods. Use `add` for additive fingerprint changes; dependency bumps stay user/Dependabot/catalog-driven ([fingerprint.md](./fingerprint.md)).

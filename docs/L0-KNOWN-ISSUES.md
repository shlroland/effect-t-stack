# L0 known issues (exit freeze)

Frozen at L0 closeout (**signed off 2026-11-11**). Empty Active means no blockers beyond deferred product work below.

## Deferred (not L0 blockers)

**Owned by later Capability Tiers** (see [CAPABILITY-TIERS.md](./CAPABILITY-TIERS.md)):

- **CLI `--api` / primary flip** (`rpc` ↔ `httpapi`) — flag/prompt plumbing landed; L3 Option Matrix completeness — [ADR-0006](./adr/0006-api-primary-rpc-with-httpapi-secondary.md); gated in [compatibility.md](./compatibility.md)
- **Optional `effect-style`** at `create` / `add` (omit path; `--yes` stays on) — flag wiring landed; L3 Addons matrix
- Human “how to read `ets.jsonc`” UX polish beyond [fingerprint.md](./fingerprint.md) — L5 docs
- Scaffold `migrate` / codemods for old generated apps — explicit non-goal ([ADR-0004](./adr/0004-scaffold-defaults-and-invariants.md))

**Parked (later — revisit after L1+; not scheduled):**

- Dependabot / outdated CI scoped to the Dependency Catalog
- Browser E2E (Playwright) for `apps/web` — smoke covers imports/loaders only
- TypeScript 7 / `@effect/tsgo` — intentional lag until ADR (Golden Sample is on TS 6.x as the stepping stone)
- `@effect/oxc` on npm — vendored via `repos` until published

## Active

_(none)_

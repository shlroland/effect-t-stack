# L0 known issues (exit freeze)

Frozen at L0 closeout. Empty means no blockers beyond deferred product work below.

## Deferred (not L0 blockers)

- **CLI Option Matrix** for optional `effect-style` (`create` / `add` omit) — L1+
- Human “how to read `ets.jsonc`” UX polish beyond [fingerprint.md](./fingerprint.md) — L2/L5 docs
- Scaffold `migrate` / codemods for old generated apps — explicit non-goal ([ADR-0004](./adr/0004-scaffold-defaults-and-invariants.md))
- Dependabot / outdated CI scoped to the Dependency Catalog — optional post-L0
- Browser E2E (Playwright) for `apps/web` — out of L0; smoke covers imports/loaders only
- TypeScript 7 / `@effect/tsgo` — intentional lag until ADR
- `@effect/oxc` on npm — vendored via `repos` until published

## Active

_(none)_

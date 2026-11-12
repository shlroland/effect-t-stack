# Dependency Catalog

Single pin source for the Golden Sample (and later templates). Versions live in the root [`package.json`](../package.json) under `workspaces.catalog`; workspace packages reference them with `"catalog:"`.

See [ADR-0002](./adr/0002-dependency-currency.md).

## How to bump

1. Edit `workspaces.catalog` in the root `package.json`
2. `bun install`
3. `bun run check`
4. If an intentional lag changes, update this file and `ets.jsonc` notes

## Intentional lags

| Package                       | Pin policy              | Why                                                                                                   |
| ----------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `typescript`                  | **6.x** (`^6.0.3`)      | Stepping stone toward TS 7 / `@effect/tsgo`; keep `@effect/language-service` (TS 7+ switches to tsgo) |
| `@effect/language-service`    | pinned minor (`0.87.5`) | Paired with TypeScript 6.x (not for TS 7+)                                                            |
| `drizzle-orm` / `drizzle-kit` | **`1.0.0-rc.5`** exact  | Required for `drizzle-orm/effect-sqlite-bun`; npm `latest` is still 0.45.x                            |
| `@effect/oxc`                 | unpublished → vendored  | Loaded from `repos/effect/packages/tools/oxc` via the `repos` addon                                   |
| `@effect/atom-react`          | catalog (`^4.1.3`)      | React bindings for Effect Atom; peer `scheduler` also catalog-pinned                                  |

Everything else defaults to current stable within the catalog ranges.

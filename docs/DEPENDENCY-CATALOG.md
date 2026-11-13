# Dependency Catalog

Single pin source for the Golden Sample and for `packages/template-generator`. Golden versions live in [`examples/golden/package.json`](../examples/golden/package.json) under `workspaces.catalog`; workspace packages reference them with `"catalog:"`. The generator's pin table is `dependencyVersionMap` in `packages/template-generator/src/utils/dependency-versions.ts`. Until `examples/golden` is removed, bump both together — templates do not hard-code versions. The generator catalogs duplicates into the emitted `workspaces.catalog`.

See [ADR-0002](./adr/0002-dependency-currency.md).

## How to bump

1. Edit `workspaces.catalog` in `examples/golden/package.json` and the same pin in `dependencyVersionMap`
2. `bun install --cwd examples/golden`
3. `bun run check:golden` (and `bun run check` at Scaffold Product root)
4. If an intentional lag changes, update this file and `examples/golden/ets.jsonc` notes

## Intentional lags

| Package                       | Pin policy               | Why                                                                                                   |
| ----------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `typescript`                  | **6.x** (`^6.0.3`)       | Stepping stone toward TS 7 / `@effect/tsgo`; keep `@effect/language-service` (TS 7+ switches to tsgo) |
| `@effect/language-service`    | pinned minor (`0.87.5`)  | Paired with TypeScript 6.x (not for TS 7+)                                                            |
| `drizzle-orm` / `drizzle-kit` | **`1.0.0-rc.5`** exact   | Required for `drizzle-orm/effect-sqlite-bun`; npm `latest` is still 0.45.x                            |
| `@effect/oxc`                 | unpublished → owned copy | `packages/effect-oxc`, taken from Effect commit `7865dbbb7`. Use the npm package when it exists.      |
| `@effect/atom-react`          | catalog (`^4.1.3`)       | React bindings for Effect Atom; peer `scheduler` also catalog-pinned                                  |

Everything else defaults to current stable within the catalog ranges.

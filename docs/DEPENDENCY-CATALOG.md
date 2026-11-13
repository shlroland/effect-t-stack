# Dependency Catalog

The only pin table is `dependencyVersionMap` in `packages/template-generator/src/utils/dependency-versions.ts`. Templates name dependencies and do not hard-code versions. The generator writes a Bun `workspaces.catalog` for versions that appear in more than one package, and rewrites those ranges to `catalog:`.

See [ADR-0002](./adr/0002-dependency-currency.md) and [ADR-0007](./adr/0007-templates-are-the-source-of-truth.md).

## How to bump

1. Edit the pin in `dependencyVersionMap`
2. `bun run check` at the Scaffold Product root
3. `ETS_GENERATED_BUILD=1 bun test packages/template-generator/test/generated-build.test.ts`
4. If an intentional lag changes, update this file

## Intentional lags

| Package                       | Pin policy               | Why                                                                                                   |
| ----------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `typescript`                  | **6.x** (`^6.0.3`)       | Stepping stone toward TS 7 / `@effect/tsgo`; keep `@effect/language-service` (TS 7+ switches to tsgo) |
| `@effect/language-service`    | pinned minor (`0.87.5`)  | Paired with TypeScript 6.x (not for TS 7+)                                                            |
| `drizzle-orm` / `drizzle-kit` | **`1.0.0-rc.5`** exact   | Required for `drizzle-orm/effect-sqlite-bun`; npm `latest` is still 0.45.x                            |
| `@effect/oxc`                 | unpublished → owned copy | `packages/effect-oxc`, taken from Effect commit `7865dbbb7`. Use the npm package when it exists.      |
| `@effect/atom-react`          | map (`^4.1.3`)           | React bindings for Effect Atom; peer `scheduler` is also pinned in the map                            |

Everything else defaults to current stable within the map ranges.

# Keep a Dependency Catalog; default to current stable pins

Generated projects should ship **current stable** dependency versions by default (Better-T-Stack parity). We maintain a central **Dependency Catalog** as the single pin source for the Golden Sample and, later, templates — with a recurring bump → sync → `check` loop — rather than one-off edits scattered across `package.json` files. **Exception:** TypeScript stays on **6.x** with `@effect/language-service` as the stepping stone; opt into TS 7 / `@effect/tsgo` only when the whole stack is ready (see `ets.jsonc` `addonOptions.language-service`).

**Implementation (L0):** Bun `workspaces.catalog` in the root `package.json`; workspace packages use `"catalog:"`. Human lag notes and bump steps: [docs/DEPENDENCY-CATALOG.md](../DEPENDENCY-CATALOG.md).

## Considered options

- One-time bump only — rejected: scaffolds go stale immediately
- Always chase every major including TypeScript 7 — rejected: breaks the intentional language-service / ecosystem compatibility posture
- Remain on TypeScript 5.x — superseded: Golden Sample now pins 6.x as the pre-TS7 footing

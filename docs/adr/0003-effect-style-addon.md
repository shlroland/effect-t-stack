# Effect-aligned style is an optional `effect-style` addon; the default stack enables it

Code format, lint, and Effect API/naming conventions should match the Effect-TS monorepo (`dprint` + `oxlint`/`@effect/oxc` + `LLMS.md` conventions + language-service). That gate is packaged as Fingerprint addon **`effect-style`**: optional in the Option Matrix so users can opt out, but the **default templates enable it** and fold lint into `check`/CI when present. Alternate lint stacks (`biome`, etc.) are mutually exclusive with `effect-style` unless a later ADR revisits that. The lint plugin is the owned copy in `packages/effect-oxc`.

## Implementation notes (L0)

- `@effect/oxc` is not published on npm yet. The oxlint JS plugin is the owned copy in `packages/effect-oxc` (upstream Effect commit `7865dbbb7`). Switch to the npm package when Effect publishes it.
- Lint scripts are scoped to `apps` + `packages`. The Effect rules come from `packages/effect-oxc`. A vendored `repos/effect` checkout, when present, is reference source and is not the lint plugin.
- Application code may import the public `effect` / `@effect/*` barrels; relative index-barrel imports stay banned.
- Pre-commit uses **Lefthook** (`lefthook.yml`: staged `dprint fmt` + `oxlint --fix`, `stage_fixed`). Prefer Lefthook over husky + lint-staged (one tool; BTS-aligned). Mutually exclusive with husky. CI workflow gate is still pending.

# Effect-aligned style is an optional `effect-style` addon; Golden Sample enables it

Code format, lint, and Effect API/naming conventions should match the Effect-TS monorepo (`dprint` + `oxlint`/`@effect/oxc` + `LLMS.md` conventions + language-service). That gate is packaged as Fingerprint addon **`effect-style`**: optional in the Option Matrix so users can opt out, but the **Golden Sample defaults to enabling it** and folds lint into `check`/CI when present. Alternate lint stacks (`biome`, etc.) are mutually exclusive with `effect-style` unless a later ADR revisits that.

## Implementation notes (L0)

- `@effect/oxc` is not published on npm yet. The oxlint JS plugin is the owned copy in `packages/effect-oxc` (upstream Effect commit `7865dbbb7`). Switch to the npm package when Effect publishes it.
- Lint scripts are scoped to `apps` + `packages` so oxlint does not apply `repos/effect/.oxlintrc.json`.
- Application code may import the public `effect` / `@effect/*` barrels; relative index-barrel imports stay banned.
- Pre-commit uses **Lefthook** (`lefthook.yml`: staged `dprint fmt` + `oxlint --fix`, `stage_fixed`). Prefer Lefthook over husky + lint-staged (one tool; BTS-aligned). Mutually exclusive with husky. CI workflow gate is still pending.

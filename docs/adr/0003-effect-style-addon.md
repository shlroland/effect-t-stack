# Effect-aligned style is an optional `effect-style` addon; Golden Sample enables it

Code format, lint, and Effect API/naming conventions should match the Effect-TS monorepo (`dprint` + `oxlint`/`@effect/oxc` + `LLMS.md` conventions + language-service). That gate is packaged as Fingerprint addon **`effect-style`**: optional in the Option Matrix so users can opt out, but the **Golden Sample defaults to enabling it** and folds lint into `check`/CI when present. Alternate lint stacks (`biome`, etc.) are mutually exclusive with `effect-style` unless a later ADR revisits that.

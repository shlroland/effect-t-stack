# Scaffold defaults: branding, testing, fingerprint, upgrade, telemetry

Cross-cutting defaults for the Scaffold Product (details beyond the Option Matrix):

- **Branding:** repo/product `effect-t-stack`; npm/binary `create-effect-t-stack`; Golden Sample scope `@ets/*`, renamed on create to `@<project>/*`.
- **Testing:** BTS-style three tiers (contract → generated-builds → live). Do not assert equality on copied template file text; prove via install/typecheck/test/boot.
- **Fingerprint:** `ets.jsonc.version` is schema version; CLI release is stamped separately (`reproducibleCommand` / `cliVersion`). Schema lives in-repo first; hosted `$schema` optional later.
- **Upgrade:** `add` only — no scaffold migrate/codemods. Dependency freshness is the Dependency Catalog / user tooling.
- **Telemetry:** opt-in (privacy-first), scrubbed events, no project path/name.
- **Env:** Golden Sample keeps Effect `Config`; optional typed env codegen is L4+.
- **UI:** Golden Sample may stay on custom CSS; shared shadcn `packages/ui` is L4+.
- **Non-goals (unless reopened):** scaffold i18n, first-class realtime examples, Convex/`self`, parallel tRPC/oRPC.

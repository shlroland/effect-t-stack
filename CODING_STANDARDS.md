# Coding standards (review)

Read during **review**, not as always-on implementation context. Mechanical rules belong in lint / `check` / hooks; this file is for **judgement calls**.

## Scaffold CLI (`apps/cli`)

- **Illegal / deferred create·add rules** live only in `apps/cli/src/compatibility/catalog.ts` (+ agent-facing prose in `docs/compatibility.md`). Do not invent a second validator or scatter rule messages in command handlers.
- **Contract tests** prove parse / rename / denylist / generated-build probes — never assert full Golden Sample file-text equality.
- **Named exports** in CLI application code (same as golden `effect-style`); default export only when a tool contract requires it.

## Golden Sample (`examples/golden`)

- Prefer patterns from `repos/effect` + `LLMS.md` over training-data guesses when Effect API shape is ambiguous.
- Package placement judgements: [`docs/golden-boundaries.md`](./docs/golden-boundaries.md).
- Do not add a competing formatter/linter alongside `effect-style`.

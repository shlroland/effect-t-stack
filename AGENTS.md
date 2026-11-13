# AGENTS.md — effect-t-stack Scaffold Product

本仓库是 **effect-t-stack Scaffold Product**。`apps/cli` 提供 `create-effect-t-stack`。生成应用的唯一产品源是 [`packages/template-generator`](./packages/template-generator)（[ADR-0007](./docs/adr/0007-templates-are-the-source-of-truth.md)）。`examples/golden` 已删除。

## Navigation

| When                                          | Read                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Edit CLI / tests / create·add gates           | [`apps/cli/README.md`](./apps/cli/README.md) (layout: `add/` · `create/` · `compatibility/` · `test/`) |
| Tier status / what is open                    | [`docs/CAPABILITY-TIERS.md`](./docs/CAPABILITY-TIERS.md)                                               |
| Illegal create·add combinations               | [`docs/compatibility.md`](./docs/compatibility.md)                                                     |
| Fingerprint (`ets.jsonc`) fields              | [`docs/fingerprint.md`](./docs/fingerprint.md)                                                         |
| Generated app packages / invariants           | [`docs/golden-boundaries.md`](./docs/golden-boundaries.md)                                             |
| Dependency pins                               | [`docs/DEPENDENCY-CATALOG.md`](./docs/DEPENDENCY-CATALOG.md)                                           |
| Review judgement (not mechanical lint)        | [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)                                                         |

## Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `repos/effect/LLMS.md`
**completely**, and follow the links in the file when required.

When writing Effect code, inspect `repos/effect/` for idiomatic usage, tests,
module structure, and API design. Treat it as the source of truth for Effect
patterns — prefer it over training-data guesses, web search, or stale v3 docs.

If a detail is missing there, read the installed `effect` package in a generated app (`node_modules/effect/src`) after `bun install`.

For **documentation lookup** (module READMEs, API guides), use the project MCP
server `effect-docs` (`effect_docs_search` / `get_effect_doc`) configured in
`.cursor/mcp.json`. Prefer MCP over web search for Effect docs.

Authority order when sources disagree:

1. This repo’s `AGENTS.md` + package boundaries (ETS Effect Core → [`docs/golden-boundaries.md`](./docs/golden-boundaries.md))
2. `repos/effect` / `LLMS.md` (+ installed `effect` package)
3. MCP `effect-docs` (official docs index)
4. Optional `effect-solutions` CLI — only when a generated app sets `addonOptions.mcp.effectSolutions.enabled` to `true` (secondary patterns; never overrides 1–2)

## Vendored Repositories

This project vendors external repositories under `repos/`. Oxlint ignores that tree. Effect-style rules load from `packages/effect-oxc`.

- Use vendored repositories as **read-only reference material** when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do **not** edit files under `repos/` unless explicitly asked
- Do **not** import from `repos/` — application code must keep importing from normal package dependencies (`effect`, `@effect/*`)
- CLI **does not copy** `repos/` into generated apps. Effect-style lint loads `packages/effect-oxc` (owned copy of unpublished `@effect/oxc`). `repos/effect` is only for reading Effect source (`LLMS.md`, idioms, migration guides). Switch the lint plugin to the official npm package when Effect publishes it.

Update Effect source when needed:

```sh
git subtree pull --prefix=repos/effect https://github.com/Effect-TS/effect.git main --squash
```

## Scaffold Product vs templates

| Area        | Path                                              | Role                                                                                                                                             |
| ----------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| CLI         | `apps/cli`                                        | `create-effect-t-stack` via **`effect/cli`** + BunServices — generates from `packages/template-generator`; **no** domain/SQL/HTTP business logic |
| Templates   | `packages/template-generator`                     | Only product source of truth for generated apps                                                                                                  |
| Lint plugin | `packages/effect-oxc`                             | Owned copy of unpublished `@effect/oxc`; the template copies it into generated apps                                                             |
| Docs / ADRs | `docs/`                                           | Capability Tiers, fingerprint, compatibility, decisions                                                                                          |
| Pins        | `dependencyVersionMap` in the template generator  | The only dependency pin table                                                                                                                    |

**Ownership:** edit the Handlebars fragment or the post-processor, then prove it with a generated-build. Do not recreate a second default monorepo.

## Default stack

Effect **v4** · Bun · **Rpc primary / HttpApi secondary** ([ADR-0006](./docs/adr/0006-api-primary-rpc-with-httpapi-secondary.md)) · SQLite + **Drizzle 1.0 RC** · auth **none** · frontend **TanStack Start** (Todo UI = `AtomRpc`) · backend **self** · env `@{{projectName}}/config` · addons `turborepo` + `skills` + `repos` + `language-service` (TS 6.x) + `mcp` + `effect-style`.

Change that stack in the templates, then update the fingerprint the generator writes.

## Effect style (`effect-style` addon)

The default stack enables **`effect-style`**. When present:

- Format with **`dprint`** (ASI, double quotes, no trailing commas, lineWidth 120 — same settings as the Effect repo)
- Lint with **`oxlint`** + the rules in `packages/effect-oxc` (generated config: `.oxlintrc.json`)
- Generated `bun run check` includes `lint`; Scaffold pre-commit via root **Lefthook**; CI via `.github/workflows/check.yml`
- Naming / modules / API conventions follow `repos/effect` + `LLMS.md` (PascalCase modules, `Context.Service`, `Schema.TaggedError`, `Effect.fn`, `.ts` import extensions, …)
- **Named exports only** — do not use `export default` / default imports in application code (and CLI). Exceptions only when a tool/framework contract requires default export (oxlint `import/no-default-export`), in generated apps:
  - Effect SQL file migrations (`packages/db/effect-sql-migrations/**`)
  - TanStack Start server entry (`apps/web/src/server.ts`)
  - Tooling config files (`*.config.ts`)
- Do **not** add competing formatters/linters (`biome`, etc.) alongside this addon

`@effect/oxc` is not on npm yet. The owned copy is [`packages/effect-oxc`](./packages/effect-oxc). Switch to the official package when Effect publishes it (see that README).

## Effect MCP (`mcp` addon)

Scaffold Product Cursor MCP config: `.cursor/mcp.json` → server `effect-docs` via
`npx -y effect-mcp@latest`. (`.cursor` is denylisted from CLI copy.)

- Use `effect_docs_search` / `get_effect_doc` when you need Effect or `@effect/*` documentation.
- This is the coding-agent docs MCP — not the future Scaffold Product L5 create/plan MCP.

### Optional: `effect-solutions`

Off by default (`addonOptions.mcp.effectSolutions.enabled` in a generated `ets.jsonc`).
When enabled, agents may run:

```sh
bunx effect-solutions@latest list
bunx effect-solutions@latest show <topic>
```

Treat results as opinionated scenario patterns only. Stack choices in the
templates (Rpc primary / HttpApi secondary, Drizzle, domain → protocol → db → service → http/rpc) win on conflict.

## Effect language service

Generated apps use `@effect/language-service` on **TypeScript 6.x**. TS 6 is the stepping stone toward TypeScript 7; stay off TS 7 / `@effect/tsgo` until the whole stack is ready.

After changing Effect code in a template, prefer:

1. Edit the template under `packages/template-generator/templates` (never under `repos/`)
2. Prefer MCP `effect-docs` (or `repos/effect`) when unsure about an API
3. Prove the app with a generated-build (`ETS_GENERATED_BUILD=1`)
4. In a generated tree, `effect:diagnostics:server` and `effect:diagnostics:web` run the local language service

## 命令

```sh
# Scaffold Product
bun install
bun run check
bun run create -- <name> --yes
ETS_GENERATED_BUILD=1 bun test packages/template-generator/test/generated-build.test.ts
```

## 运行时

- 默认用 **Bun**（`bun test` / `bun --hot`），不要默认改成 Node/npm。
- 生成应用的 env：`apps/web/.env`（见模板里的 `.env.example`）。备选独立 server：`apps/server/.env`。
- Scaffold / CLI `check` 需要完整 workspace 解析；在 Cursor agent 里跑时对 `bun run check` / `bun run --filter=create-effect-t-stack check` 使用非沙箱权限（否则会出现假红的 missing `@effect/platform-bun` / bun types）。

## Agent skills

### Issue tracker

GitHub Issues on `shlroland/effect-t-stack` via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

# Capability Tiers — Better-T-Stack parity backlog

Formal todos for对标 Better-T-Stack. Implement **strictly L1 → L6**; do not skip tiers for L5/L6 product work. See [ADR-0001](./adr/0001-effect-core-and-capability-tiers.md) and root `GLOSSARY.md`.

**Defaults (Golden Sample):** Bun · Effect HttpApi（Start self-host；`apps/server` secondary）· SQLite + Drizzle（Effect SQL secondary via `@ets/db/effect-sql`）· auth `none` · TanStack Start · turborepo · example `todo`.

**Non-goals:** `api` tRPC/oRPC as first-class (L6c); Convex; scaffold-level i18n; first-class realtime (SSE/WS) examples (unless a later example slice is explicitly added); auto-`migrate`/codemod upgrades of old generated apps. Golden Sample **does** use Start self-host for HttpApi (`backend=self`); standalone `apps/server` remains a secondary template.

**Branding (default):** repo / product `effect-t-stack`; npm / binary `create-effect-t-stack`; workspace scope in Golden Sample `@ets/*`, on `create` renamed to `@<project>/*`.

---

## L0 — Golden Sample

> **L0 is not exit-complete.** `bun run check` passing means runnable, not “ready to freeze as the canonical template.” Do **not** start L1 Scaffold Product until **L0 exit criteria** below are met (or explicitly waived in an ADR).

### Baseline present (necessary but not sufficient)

- [x] Runnable monorepo: Bun · HttpApi（Start self）· SQLite+Drizzle · auth none · TanStack Start · turborepo
- [x] Fingerprint `ets.jsonc` (v1 — expect schema churn; see Fingerprint hygiene)
- [x] Packages: domain · protocol · db · client · config
- [x] Apps: server · web
- [x] Todo vertical slice + Repository / Service / HttpApi tests
- [x] Addons present: turborepo · skills · repos · language-service · mcp（`effect-mcp`；`effect-solutions` 可选且默认关）
- [x] In-server OpenAPI + `/api/docs`
- [x] Secondary Effect Rpc under `/rpc` (`AppRpcs` + NDJSON; same Services)
- [x] Operational endpoints: `health` / `ready` (ready = migrations + DB)
- [x] Dev CORS middleware; HTTP boundary `Effect.logError` mapping

### Golden Sample quality debt (active L0 work)

From review vs `AGENTS.md` / `repos/effect` / `LLMS.md` (2026-11-10). Clear or ADR-waive before L1.

**P0 — boundaries**

- [x] `apps/server/src/http/SystemHttp.ts` still yields `Migrations`; add `System` Service; HTTP stays thin
- [x] Narrow `layers.ts` so HTTP layers see Services only, not raw `Database`/`Migrations`

**P1 — rules & coverage**

- [x] Move empty-patch `update` behavior from `TodosRepository` into `Todos` Service
- [x] HttpApi tests: `/api/health` `/api/ready` (+ 503 on DB fail); Todo 404 paths; infra → 500/503 via `Errors.ts`
- [x] Repository tests: decode failure, missing row, empty update after rule move
- [x] `@ets/config`: shared Effect Schema/Config `ServerEnv` + `loadServerEnv` (tsconfig + env); server keeps `AppConfig` Context.Service

**P2 — Effect idiom & web DX**

- [x] Drop pure pass-through `Effect.fn` wrappers in `Todos` (`all`/`create`); name Http handler spans (`Effect.fn("…")`)
- [x] Clarify `Migrations.ready` API vs real DB ping (`ready` now runs `select 1` after boot migrations)
- [x] Web: TanStack Start `loader` instead of `useEffect` fetch; use `/ready` for connected status; mutation error handling; empty state
- [x] Web: type helpers with `TodoId`; drop unused `@ets/protocol` dep or use it intentionally; `apps/web/.env.example` for `VITE_API_URL`
- [x] CORS/origins from `Config`/env; root `engines`; richer `apps/server/.env.example`
- [x] Prefer keeping Drizzle `schema` internal; Effect SQL secondary lives under `@ets/db/effect-sql`

**P3 — polish (may waive)**

- [ ] Optional: Health/Ready DTOs live in protocol vs domain; http module naming closer to Effect fixtures
- [ ] Optional: client/web smoke tests; one integration test with `makeAppLive`
- [x] Apply **`effect-style`** once implemented; Dependency Catalog + bump (see below)

- [ ] Freeze short **L0 known-issues** (or empty) at exit sign-off

### L0 exit criteria (gate for L1)

- [ ] Quality debt items above resolved or waived via ADR
- [x] `effect-style` enabled in Golden Sample and `check` includes lint
- [ ] Dependency Catalog in place; intentional lags documented
- [ ] `ets.jsonc` reviewed for v1 → tidy shape (no stale comments/options)
- [ ] AGENTS.md invariants match actual code
- [ ] Explicit maintainer sign-off: “Golden Sample may be copied by CLI”

### Effect Core invariants (document + keep true in Golden Sample / templates)

- [ ] Codify in `AGENTS.md` / future project-structure docs: always `domain | protocol | db | client | config` (not BTS `packages/api`)
- [ ] HTTP error-mapping invariant: domain `Schema.TaggedError` (+ `httpApiStatus`); Service yields domain errors; `http/Errors.ts` maps only infra (e.g. `DatabaseError`, decode)
- [ ] Import / TS layout: `.ts` extensions in imports; package `exports` pointing at `./src/*.ts`; align with Effect Preserve-style module settings where applicable
- [ ] Test pattern checklist: `test/layers.ts`, in-memory SQLite, Repository / Service / HttpApiTest layers (Todo as reference)
- [ ] Post-install: `prepare` + `effect-language-service patch` owned by `language-service` addon
- [ ] L0 web UI stance: custom CSS OK; **shadcn / `packages/ui` deferred to L4** (not required in Golden Sample)
- [x] `engines` / minimum runtime fields on golden root `package.json`

### Dependency currency (ongoing — 对标 BTS “latest dependencies”)

- [ ] One-time bump of Golden Sample deps to current stable (Vite/TanStack/turbo/react/effect/drizzle/…); **TypeScript stays on 5.x** + `@effect/language-service` until an ADR opts into TS 7 / `@effect/tsgo`
- [ ] Central **Dependency Catalog** (single source of version pins for Golden Sample and later templates — BTS-style `dependencyVersionMap`)
- [ ] Document which packages may lag on purpose (today: TypeScript major, anything with peer-range locks)
- [ ] Recurring upgrade loop: bump catalog → sync Golden Sample (and templates when they exist) → `bun run check` (+ later generated-build tests)
- [ ] Optional CI: outdated check / Dependabot-or-Renovate scoped to the catalog
- [ ] When L3 extracts `.hbs`, templates consume the catalog — never hand-pin versions in scattered template files

See [ADR-0002](./adr/0002-dependency-currency.md).

### Style gate — addon `effect-style` (optional in matrix; **on by default in Golden Sample**)

Fingerprint: listed under `addons` + detailed under `addonOptions.effect-style` in `ets.jsonc`.

- [x] Implement addon **`effect-style`**: mirror Effect repo toolchain
  - [x] `dprint` (ASI, double quotes, no trailing commas, lineWidth 120 — align with `repos/effect/dprint.json`)
  - [x] `oxlint` + `@effect/oxc` Effect rules via vendored `repos/effect/.../oxc` JS plugin (not on npm yet; requires `repos` addon)
  - [x] Wire `lint` / `lint-fix` scripts; include lint in `bun run check` when addon is enabled
  - [x] Pre-commit via **Lefthook** (`lefthook.yml`: staged `dprint fmt` + `oxlint --fix`; not husky/lint-staged)
  - [ ] CI workflow gate when addon is enabled (no `.github` workflows yet)
  - [x] `AGENTS.md`: naming/modules/API conventions follow `repos/effect` + `LLMS.md` (PascalCase modules, `Context.Service`, `Schema.TaggedError`, `Effect.fn`, readonly options, `.ts` imports, …)
- [x] Golden Sample: **`effect-style` in `addons` by default** with `addonOptions` documenting versions/scripts/reproduce steps
- [ ] CLI Option Matrix: `effect-style` is **optional** (`create` / `add` can omit it); default prompt/`--yes` follows Golden Sample (enabled)
- [x] Mutual exclusion: `effect-style` conflicts with alternate formatters/linters (`biome`, `ultracite`, plain `oxlint`-only) unless an ADR says otherwise
- [x] Without `effect-style`: no dprint/oxlint gate required (language-service may still apply if that addon is present)

See [ADR-0003](./adr/0003-effect-style-addon.md).

### Fingerprint hygiene (`ets.jsonc` lifecycle)

`ets.jsonc` will grow with every addon/stage. Treat it as a **versioned, periodically compacted** contract — not an append-only junk drawer.

- [ ] Document field classes: **stack dims** (runtime/api/db/…) · **addons[]** · **addonOptions** · **meta** (`version`, `createdAt`, `reproducibleCommand`, `cliVersion`)
- [ ] **Schema bumps:** raising `ets.jsonc.version` requires a short migration note in `docs/adr/` or `docs/fingerprint/`; CLI `add`/`create` must understand N and N-1 (or refuse with upgrade message)
- [ ] **Per-tier compact:** at each Capability Tier exit (especially L0→L1, L2 fingerprint work, L3 matrix), prune obsolete `addonOptions`, collapse comments into docs links, dedupe reproduce steps
- [ ] **Single write path:** only CLI/`add` (and documented manual golden edits) mutate fingerprint; agents must not invent ad-hoc top-level keys
- [ ] **Options budget:** prefer `addonOptions.<addon>` nested objects over new root keys; root stays the Option Matrix
- [ ] **Golden vs generated:** golden may omit `createdAt`/`reproducibleCommand`; generated apps must include them once CLI exists
- [ ] Keep a human “how to read `ets.jsonc`” page (L2/L5); comments in-file stay short

See [ADR-0005](./adr/0005-l0-exit-and-fingerprint-hygiene.md).

---

## L1 — Scaffold MVP

### Repo shape

- [ ] Scaffold Product layout: `apps/cli` + Golden Sample under `examples/golden` (or equivalent)
- [ ] Root workspace wires CLI; Golden Sample remains source of truth until templates extract

### `create` command

- [ ] Interactive prompts
- [ ] `--yes` / `-y` default stack
- [ ] Whole-tree copy of Golden Sample + project/package rename (no conditional `.hbs` yet)
- [ ] Workspace rename protocol: `@ets/*` → `@<project>/*`; root `name`; turbo `--filter` / script names stay consistent
- [ ] `--package-manager` `npm` | `pnpm` | `bun`
- [ ] Emit PM artifacts by choice: `bunfig.toml` / `pnpm-workspace.yaml` / `.npmrc` as needed; map Dependency Catalog → bun/pnpm **catalog** fields when used
- [ ] `--install` / `--no-install`
- [ ] `--git` / `--no-git`
- [ ] `--directory-conflict` `merge` | `overwrite` | `increment` | `error`
- [ ] `--dry-run`
- [ ] `--verbose` (JSON result schema for agents: phases, planned files, validation)
- [ ] `--yolo`
- [ ] `--render-title` / `--no-render-title`
- [ ] `--open` (editors / coding agents)
- [ ] `--manual-db` flag plumbing (behavior in L4)
- [ ] Publish to npm (`bunx create-effect-t-stack`)
- [ ] Document minimum Bun / Node (and later Workers) like BTS prerequisites; set generated `engines` / `packageManager`
- [ ] Windows / WSL / CI notes (SQLite paths, long paths, PM matrix)

### Scaffold testing (对标 BTS three-tier)

- [ ] **Contract tests**: CLI option parsing / compatibility — never assert raw copied template string equality
- [ ] **Generated-builds**: sample catalog + per-sample `checks`, filter env, shardable; prove install/typecheck/test on generated trees
- [ ] **Live** pre-release smoke (manual or gated CI)
- [ ] ADR / AGENTS: compile/boot probes are the proof, not snapshot diffs of generated file text

### Scaffold-repo governance

- [ ] Contributing guide (`apps/cli` later, which test tier to run, conventional commits)
- [ ] `SECURITY.md` · optional `CODEOWNERS`

---

## L2 — Fingerprint, `add`, agent contract

### Fingerprint

- [ ] `ets.jsonc` fields: `$schema` · `version` · `createdAt` · `reproducibleCommand` · `addonOptions` · `dbSetupOptions` · deploy fields
- [ ] **Version semantics:** `ets.jsonc.version` = fingerprint **schema** version; CLI release stamped via `reproducibleCommand` / optional `cliVersion` field — not the same number
- [ ] In-repo JSON Schema first; optional hosted CDN schema later for editor/`$schema` UX
- [ ] Docs: keep file for `add`; safe-to-delete caveat if user abandons CLI; `add` rewrites fingerprint
- [ ] CLI ↔ generated versioning: publish `create-effect-t-stack@x.y.z`; generated apps do **not** auto-track CLI releases

### Commands

- [ ] `add` (addons into existing project)
- [ ] `add --package <name>` scaffold empty workspace package (manifest + `src/index.ts` + tsconfig)
- [ ] `add-json` · `create-json`
- [ ] `schema --name …` (`all` · `createInput` · `addonOptions` · …)
- [ ] `history` (`--limit` · `--json` · `--clear`) — **local only**, documented paths, no upload; privacy note in help

### Validation & upgrade

- [ ] Compatibility engine: reject illegal combinations at create/add
- [ ] Documented Effect-specific rules + illegal combo catalog (e.g. `database=none`+drizzle; payments without better-auth; `frontend=none` API-only shape)
- [ ] Validation order (enums → combinations → auth/addons → examples) documented for agents
- [ ] **Upgrade policy:** `add` only; no scaffold `migrate`/codemods; dep bumps are user/Dependabot/catalog-driven; fingerprint records additive changes only

---

## L3 — Effect Core Option Matrix

Introduce `packages/template-generator` + `.hbs` when combinations explode (expected during this tier).

### API

- [ ] `api=httpapi` only (default; locked until a future ADR reopens L6c)

### Runtime (`--runtime`)

- [ ] `bun` (default)
- [ ] `node`
- [ ] `workers`
- [ ] `none` (only where a combination requires it)

### Database (`--database`)

- [ ] `sqlite` (default)
- [ ] `postgres`
- [ ] `mysql`
- [ ] `mongodb`
- [ ] `none`

### ORM (`--orm`)

- [ ] `drizzle` (default)
- [ ] `prisma`
- [ ] `mongoose` (with mongodb)
- [ ] `none`

### Auth (`--auth`) — full surface

- [ ] `none` (Golden Sample default)
- [ ] `better-auth`
  - [ ] Server wiring (Layer / HttpApi group)
  - [ ] DB schema / migrations per ORM
  - [ ] Session model
  - [ ] Sign-in / sign-up UI
  - [ ] Protected routes
  - [ ] Typed client session helpers
- [ ] `clerk`
  - [ ] Frontend SDK
  - [ ] Server token/session verification
  - [ ] Protected routes
- [ ] Compatibility rules
  - [ ] No backend / no DB ⇒ force `auth=none`
  - [ ] better-auth × ORM variants (drizzle / prisma / …)
  - [ ] Auth × frontend variants (web + native as those land)
  - [ ] clerk × supported frontend/runtime matrix

### Payments (`--payments`)

- [ ] `none`
- [ ] `polar` (requires better-auth)

### Frontend — web (`--frontend`)

- [ ] `tanstack-start` (default)
- [ ] `tanstack-router`
- [ ] `react-router`
- [ ] `next`
- [ ] `nuxt` _(low priority)_
- [ ] `svelte` _(low priority)_
- [ ] `solid` _(low priority)_
- [ ] `astro` _(low priority)_
- [ ] `none` (API-only)

### Frontend — native

- [ ] `native-bare`
- [ ] `native-uniwind`
- [ ] `native-unistyles`
- [ ] Web + native multi-frontend

### Examples (`--examples`)

- [ ] `todo` (default)
- [ ] `ai`
- [ ] `none`

### Addons (`--addons`)

- [ ] Task runners: `turborepo` (have) · `nx` · `vite-plus` (mutually exclusive)
- [ ] Lint/format: `biome` · `oxlint` · `ultracite`
- [x] Git hooks: `lefthook` (Golden Sample default via `effect-style`) · `husky` (optional alternate; mutually exclusive)
- [ ] Docs apps: `starlight` · `fumadocs`
- [ ] Desktop / extension: `pwa` · `tauri` · `electrobun` · `wxt` · `opentui`
- [ ] Agent: `skills` (have) · `mcp` (have: coding-agent `effect-docs`；`effect-solutions` optional/off)
- [ ] Observability: `evlog` · `axiom` (adapted to Effect HttpApi, not Hono-only)
- [ ] ETS-specific: `repos` · `language-service` · **`effect-style`** (default on in Golden Sample; optional at create/add)

### Presets

- [ ] `--template` `none`
- [ ] Effect-oriented presets (optional analogues of mern/pern/t3 — names TBD)

### Template engine

- [ ] `packages/template-generator` (in-memory VFS; Handlebars helpers; post-processors: scope rename, turbo scripts, README, `reproducibleCommand`)
- [ ] Handlebars templates + helpers (`eq` / `ne` / `and` / `or` / `includes`)
- [ ] **Golden Sample → templates sync script** (edit golden first; regenerate templates; never hand-pin versions outside Dependency Catalog)
- [ ] Document ownership: which paths are golden-owned vs template-only overlays
- [ ] `db:*` script matrix per database/ORM/deploy combo (BTS `DbScriptSupport` analogue)

---

## L4 — Generated-project ops & UX

### Env

- [ ] Per-app `.env.example`
- [x] **L0/default:** Effect `Config` via `@ets/config` `ServerEnv` → server `AppConfig` Layer; tooling uses `loadServerEnv`
- [ ] **L4 optional:** typed env codegen (Varlock **or** Effect Schema generate) + `env:generate` when chosen
- [ ] Web `VITE_*` vs server env split documented
- [ ] CORS: dev allowlist; prod from env; document placeholder rate-limit / security-headers (off by default)

### DB setup (`--db-setup`)

- [ ] `none`
- [ ] `docker` (+ compose)
- [ ] `turso` · `d1` (sqlite)
- [ ] `neon` · `supabase` · `prisma-postgres` (postgres)
- [ ] `planetscale` (mysql/postgres)
- [ ] `mongodb-atlas`
- [ ] `dbSetupOptions`: `alchemy` | `auto` | `manual`

### Deploy

- [ ] `--web-deploy`: `none` · `docker` · `vercel` · `cloudflare` · `prisma`/Alchemy
- [ ] `--server-deploy`: same set, constrained by runtime
- [ ] `packages/infra` when Alchemy/cloud infra is selected

### UI / app chrome

- [ ] Shared `packages/ui` for React family (shadcn or chosen system) — **not** in L0 golden
- [ ] Login / dashboard routes when auth ≠ none
- [ ] Optional CI workflow templates for generated repos (`check`, optional smoke)

---

## L5 — Scaffold Product surfaces

- [ ] Docs site `apps/web`
- [ ] Stack Builder UI + `builder` command
- [ ] `docs` command (open docs)
- [ ] Local MCP server (`mcp`) — Scaffold Product create/plan/preview surface（不同于 L0 coding-agent `effect-docs`）
- [ ] Hosted MCP (plan / preview / command) _(optional)_ — hosted stays plan/preview; heavy `addonOptions` need local CLI
- [ ] Agent plugin (Claude Code / Codex / …)
- [ ] Programmatic API: `create` · `createVirtual` · `add` (silent mode, Result types, parity with JSON commands)
- [ ] Telemetry _(low priority)_: **opt-in by default** (unlike BTS default-on); `--disable-analytics` / `ETS_TELEMETRY_DISABLED` / `DO_NOT_TRACK`; scrub `cli_failed`; never project name/path
- [ ] `sponsors` _(lowest priority)_
- [ ] Public docs: options · **compatibility** (Effect rules) · **project-structure** (conditional apps/packages) · `ets.jsonc` guide

---

## L6 — Backend Adapter (max L6b)

- [ ] **L6a** Same HttpApi on multiple runtime hosts — merge with L3 `--runtime`; do not duplicate
- [ ] **L6b** Thin HTTP shells (Hono / Elysia / …) that mount Effect Core handlers/Layers
- [ ] ~~L6c Parallel tRPC/oRPC~~ **non-goal**
- [ ] ~~L6d Convex~~ **non-goal**
- [x] Start self-host HttpApi (`backend=self`) — Golden Sample default; standalone Bun server secondary

---

## Tracking notes

| BTS concept                   | ETS stance                                               |
| ----------------------------- | -------------------------------------------------------- |
| `backend` hono/express/…      | Separate Server + Effect; L6b shell only                 |
| `backend` self                | Golden Sample default with TanStack Start + HttpApi      |
| `api` trpc/orpc               | HttpApi only                                             |
| `auth` better-auth/clerk/none | Full L3 surface; Golden Sample stays `none`              |
| `bts.jsonc`                   | `ets.jsonc`                                              |
| Convex                        | Non-goal                                                 |
| Biome / oxlint addons         | Prefer **`effect-style`** (default on); mutual exclusion |
| Analytics default-on          | ETS telemetry **opt-in**                                 |
| Template string snapshots     | Forbidden; use generated-build probes                    |
| `packages/api`                | Use `protocol` + `client` instead                        |
| i18n / realtime examples      | Non-goals unless explicitly reopened                     |
| Scaffold `migrate`            | Non-goal; `add` only                                     |

See also: [ADR-0001](./adr/0001-effect-core-and-capability-tiers.md) · [ADR-0002](./adr/0002-dependency-currency.md) · [ADR-0003](./adr/0003-effect-style-addon.md) · [ADR-0004](./adr/0004-scaffold-defaults-and-invariants.md) · [ADR-0005](./adr/0005-l0-exit-and-fingerprint-hygiene.md)

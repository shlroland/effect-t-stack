# BTS template-generator anatomy

Research note for [Research: BTS template-generator anatomy](https://github.com/shlroland/effect-t-stack/issues/2), part of [L3: BTS-mode template source of truth](https://github.com/shlroland/effect-t-stack/issues/1).

This is reference material for [Task: Scaffold packages/template-generator skeleton](https://github.com/shlroland/effect-t-stack/issues/4). It does not change the generator, the CLI copy path, or the Golden Sample. L3 exit stays: templates become the only product source of truth; the Golden Sample is extracted once, then deleted.

Better-T-Stack does not keep a runnable default monorepo. The product source of truth is `packages/template-generator`: a tree of Handlebars fragments, selected by a `ProjectConfig`, rendered into an in-memory filesystem, then rewritten by TypeScript post-processors. A generated app exists only after `generate()` plus `writeTree()`. The CLI default stack is a config constant that picks those fragments. Proof is a generated-build (install, typecheck, build, optional boot), never a string snapshot of template text.

Pinned source: [`AmanVarshney01/create-better-t-stack` `a9bd456ccc9d80b8b90e65075aac99b08d7af43f`](https://github.com/AmanVarshney01/create-better-t-stack/tree/a9bd456ccc9d80b8b90e65075aac99b08d7af43f) (`@better-t-stack/template-generator` 3.49.0). At that commit the template tree is 532 files, 446 of them `.hbs`. There is no `examples/` app in the repo root. `apps/web` is the docs site.

This is the anatomy a later [Task: Scaffold packages/template-generator skeleton](https://github.com/shlroland/effect-t-stack/issues/4) can copy. It does not change effect-t-stack’s default-stack semantics (Rpc primary, HttpApi secondary, Bun, SQLite+Drizzle, auth none, TanStack Start, effect-style on).

---

### 1. End-to-end create

`apps/cli/src/helpers/core/create-project.ts` `createProject`:

1. `generate({ config, templates: EMBEDDED_TEMPLATES, version })` from `@better-t-stack/template-generator`.
2. `writeTree(tree, projectDir)` from the separate `./fs-writer` export (Node filesystem; not used in the browser).
3. Stamp the package-manager version into the written `package.json`.
4. Disk-only steps that are **not** inside the generator: `setupDatabase`, `setupAddons`, format, install, git.

`generate` (`packages/template-generator/src/generator.ts`) returns `Result<VirtualFileTree, GeneratorError>`. It refuses an empty template map (`phase: "initialization"`). The authoritative order inside `generate` is:

1. Template handlers write fragments into the VFS (later writes win on the same path).
2. `processPackageConfigs` — names, root/workspace scripts, npm `allowScripts`.
3. `processDependencies` — workspace links, per-dimension deps, then turbo / nx / vite-plus JSON.
4. `finalizeAlchemyDevScripts` — Alchemy deploy owns `dev` for the selected app.
5. `processEnvVariables` — `.env` / `.env.local`.
6. `processAuthPlugins` — ts-morph splice into `packages/auth/src/index.ts`.
7. `processAlchemyPlugins` — string/config edits for Cloudflare / Prisma hosting.
8. `processPwaPlugins` — ts-morph edits of Vite/Next/document.
9. `processVarlock` — optional typed-env overlay, reads the `.env` just written.
10. `processCatalogs` — hoist duplicate versions to a Bun/pnpm catalog.
11. `processVercelConfig` — programmatic `vercel.json`.
12. `processReadme` — programmatic `README.md`.
13. `writeBtsConfigToVfs` — only when `options.version` is set.

`post-process/index.ts` `processPostGeneration` is a **smaller** helper (package configs, catalogs, Vercel only). `generate` does not call it. Scaffold the `generate()` sequence, not that helper.

The returned tree is `{ root: vfs.toTree(config.projectName), fileCount, directoryCount, config }`. `writeTree` walks it. A file whose content is the marker `[Binary file]` and which has `sourcePath` is copied from `templates-binary/` rather than written as text (`src/fs-writer.ts`).

`add` does **not** regenerate the project. `apps/cli/src/helpers/core/add-handler.ts` seeds a new VFS with the existing `package.json` files and a small text-file list, runs `processAddonTemplates` plus the addon dep/plugin/task-runner processors, then `writeTree`s the delta. Package `name` fields are restored after `processPackageConfigs` so `add` does not rename the project.

Browser/Stack Builder uses the same `generate` with `EMBEDDED_TEMPLATES` (`apps/cli/src/index.ts` `createVirtual`, `apps/cli/src/virtual.ts`). `createVirtual` does not pass `version`, so that path omits `bts.jsonc`. CLI create passes `getLatestCLIVersion()`.

---

### 2. Template tree layout

Root: `packages/template-generator/templates/`. A handler maps a **prefix** to a **destination prefix** via `processTemplatesFromPrefix` (`src/template-handlers/utils.ts`). The prefix directory is stripped; the rest of the path is the output path. `.hbs` is removed. `_gitignore` → `.gitignore`, `_npmrc` → `.npmrc`, `_dockerignore` → `.dockerignore`, `_vercelignore` → `.vercelignore` (`transformFilename` in `src/core/template-processor.ts`).

| Prefix | Dest | When |
| --- | --- | --- |
| `base/` | repo root | always (`template-handlers/base.ts`). Only `_gitignore`, `package.json.hbs` (empty `scripts`), `tsconfig.json.hbs` |
| `frontend/react/web-base` then `frontend/react/<framework>` | `apps/web` | one of tanstack-router, react-router, tanstack-start, next. web-base first; framework overwrites |
| `frontend/{nuxt,svelte,solid,astro}` | `apps/web` | that frontend, mutually exclusive with React web |
| `frontend/native/base` then `frontend/native/{bare,uniwind,unistyles}` | `apps/native` | native frontend. Also copies `api/<api>/native` when api is trpc/orpc and backend is not convex |
| `backend/server/base` then `backend/server/<backend>` | `apps/server` | backend is hono/express/fastify/elysia. `self` and `none` write nothing. `convex` writes `backend/convex/packages/backend` → `packages/backend` |
| `db/base`, `db/<orm>/base`, `db/<orm>/<database>` | `packages/db` | database and orm not `none`, backend not convex. Docker db-setup also copies `db-setup/docker-compose/<database>` unless deploy is already docker |
| `api/<api>/server` | `packages/api` | api not `none`, backend not convex |
| `api/<api>/context.ts` | `apps/web/src/context.ts` or `apps/server/src/context.ts` | single file; `self` lands in web |
| `api/<api>/web/...` and `api/<api>/fullstack/<framework>` | `apps/web` | client, plus fullstack routes when `backend=self` |
| `packages/config` | `packages/config` | always |
| `packages/ui` | `packages/ui` | React web only |
| `auth/<provider>/...` | `packages/auth`, `apps/web`, `apps/native`, or convex packages | auth not `none`. Tree is provider × backend × frontend (`template-handlers/auth.ts`) |
| `payments/<provider>/...` | `packages/auth` or `packages/backend`, plus web | payments not `none` |
| `addons/<addon>` | repo root (`destPrefix ""`) | each addon except `turborepo` / `nx` / `vite-plus` (those are code generators) and `pwa` (several `addons/pwa/apps/web/*` prefixes) |
| `examples/<example>/server/<orm>/...`, `examples/<example>/web/...`, `examples/<example>/fullstack/...`, `examples/<example>/native/...` | `packages/api`, `packages/db`, `apps/web`, `apps/native` | `examples` not empty/`none`. `todo` and `ai` only |
| `extras/` | `.npmrc`, `cloudflare-env.d.ts` | pnpm+native/nuxt; Cloudflare deploy. Also rewrites `pnpm-workspace.yaml` in code |
| `packages/infra` + programmatic `alchemy.run.ts` | `packages/infra` | Cloudflare, Prisma hosting, or axiom (`template-handlers/deploy.ts`, `generators/alchemy/render.ts`) |
| `deploy/docker`, `deploy/vercel`, `deploy/<target>/web/...` | root or `apps/web` | matching deploy target |

Top-level dirs: `addons`, `api`, `auth`, `backend`, `base`, `db`, `db-setup`, `deploy`, `env`, `examples`, `extras`, `frontend`, `packages`, `payments`.

Overlay rule: handlers run in the order in `generator.ts`. `vfs.writeFile` replaces. Shared files (root `package.json`, `apps/web/**`) are a base fragment plus later overlays, not one golden tree. Within one prefix, `EMBEDDED_TEMPLATES` is sorted alphabetically (`scripts/generate-templates.ts`).

Non-`.hbs` text (css, some `.ts`, `routes.ts`) is copied verbatim. Only paths ending in `.hbs` are compiled. Binary paths (png, ico, …) are stored as the marker `[Binary file]` plus `sourcePath`.

---

### 3. Handlebars

`src/core/template-processor.ts`. One shared Handlebars instance. Context is the whole `ProjectConfig` (`packages/types/src/schemas.ts` `ProjectConfigSchema`): `projectName`, `frontend[]`, `backend`, `runtime`, `database`, `orm`, `api`, `auth`, `payments`, `addons[]`, `examples[]`, `packageManager`, `dbSetup`, `webDeploy`, `serverDeploy`, plus optional `addonOptions` / `dbSetupOptions`.

Helpers:

- `eq`, `ne` — `===` / `!==`
- `and`, `or` — `args.slice(0, -1)` so Handlebars’ options object is dropped
- `not`
- `includes` — array membership (`includes frontend "solid"`)
- `appId` — Expo-style `com.anonymous.<project>` with Android/iOS sanitizers
- `usesAlchemyDatabase` — delegates to `usesAlchemyManagedDatabase` from `@better-t-stack/types`
- `apiPrefix` — `"/api"` when both deploys are Vercel, else `""`
- `usesRequestScopedCloudflareEnv` — `backend=self` + `webDeploy=cloudflare` + nuxt/svelte

Partials: `getServerUrl` and `getServerUrlSpaces` (tab vs two-space variants of the same server-URL function).

Authoring rules from BTS `AGENTS.md`:

- Subexpressions, quoted literals: `{{#if (eq orm "prisma")}}` … `{{else if (eq orm "drizzle")}}`.
- Literal `{{` in Vue/JSX must be written `\{{`.
- Scope in source is `@{{projectName}}/api`, not a fixed scope that a later rename pass rewrites. `packages/config/package.json.hbs` is `"name": "@{{projectName}}/config"`. Root `base/package.json.hbs` uses the literal name `better-t-stack`; `processPackageConfigs` then sets `name` to `projectName`. Workspace package.json `name` fields are set again in code (`@${projectName}/db|auth|api|config|ui|infra|backend`) so the Handlebars name and the post-processor agree.

Example of a matrix cell living in one file, not a second golden: `templates/db/drizzle/sqlite/src/index.ts.hbs` branches on `dbSetup == "d1"`, then runtime bun/node/none vs workers, then `dbSetup == "turso"`. `templates/db/base/package.json.hbs` switches `check-types` between `tsc -b` and `tsc --noEmit` on `api == "orpc"`, and leaves `devDependencies` empty for the dep processor. `templates/backend/server/base/package.json.hbs` inlines a Handlebars `if` inside the `build` script string.

`processFileContent` in the same module compiles almost any non-binary string. The handlers do not use it. They compile only `*.hbs`.

---

### 4. In-memory VFS

`src/core/virtual-fs.ts`. `memfs` volume, paths forced to absolute (`/…`) internally and stored relative in the tree. API the handlers need: `writeFile(path, content, sourcePath?)`, `readFile`, `exists` / `fileExists` / `directoryExists`, `readJson` / `writeJson` (2-space JSON), `deleteFile`, `getAllFiles`, `toTree`, `getFileCount`. `sourcePath` is kept only for binary files so `writeTree` can copy bytes.

`generate` is browser-safe: no `node:fs`. Disk IO is `fs-writer.ts` and `core/template-reader.ts` (dev-time glob of `templates/`). The published package does not read `templates/` at runtime.

Embed step (`scripts/generate-templates.ts`, `prebuild` before `tsdown`):

- Glob `templates/**`, sort, emit `src/templates.generated.ts` exporting `EMBEDDED_TEMPLATES: Map<string, string>` and `TEMPLATE_COUNT`.
- Binary files become the marker in the map and are copied to `templates-binary/` (published via `package.json` `files`: `dist`, `templates-binary`).
- CLI and web import `EMBEDDED_TEMPLATES`. They do not point `generate` at the working tree.

`template-reader.ts` `loadTemplates` still exists for disk reads and walks `../templates`, `../../templates`, `../../../templates` so it works from src or dist. Create does not call it.

---

### 5. Post-processors

#### package.json names and scripts — `src/post-process/package-configs.ts`

`processPackageConfigs` rewrites root plus config/ui/infra/desktop/db/auth/api (or convex backend). Root `name` becomes `projectName`. Root `scripts` are assigned from `getPackageManagerConfig`:

- turborepo: `turbo run dev|build|check-types`, filter `turbo run <script> -F <workspace> --`
- nx: `nx run-many -t …`
- vite-plus: `vp run -r …` plus `check` / `lint` / `format` / `staged`
- else the package manager’s own recursive run

It then adds `dev:web`, `dev:native`, `dev:server`, `dev:desktop`, `dev:tui` when those apps exist. DB scripts come from `src/utils/db-scripts.ts` `getDbScriptSupport`: scripts exist when backend is not convex/none and orm is drizzle or prisma (not mongoose/none). `db:push` / `db:studio` / drizzle `db:migrate` are omitted for D1+Alchemy. Root scripts are filters onto `@<project>/db`. The db package itself gets `drizzle-kit` or `prisma` commands in `updateDbPackageJson`. Docker `db:start|watch|stop|down` are either `docker compose` at the root (when deploy is docker) or filters onto the db package.

`finalizeAlchemyDevScripts` (same file) renames an app’s `dev` to `dev:bare` when Alchemy owns the process, and points the root script at that.

`processNpmScriptApprovals` (npm only) sets root `allowScripts` from `src/utils/dependency-scripts.ts` (esbuild when drizzle, node, turborepo, docker, vercel, nuxt, …). pnpm’s equivalent is `allowBuilds` in `processPnpmWorkspaceConfig` (`template-handlers/extras.ts`).

Templates deliberately leave dependency objects empty. Versions are not hand-written per file.

#### Dependencies — `src/utils/add-deps.ts` + `src/processors/*-deps.ts`

`dependencyVersionMap` is the single pin table (`typescript: "^6.0.3"`, `drizzle-orm: "1.0.0-rc.5"`, `effect: "4.0.6"`, …). `addPackageDependency({ vfs, packagePath, dependencies, devDependencies, customDependencies })` looks up the map and throws if a key is missing. Runtime wins if a name is in both sections. `customDependencies` bypass the map for intentional lags (Prisma 6 on MongoDB, planetscale driver).

`processDependencies` (`src/processors/index.ts`) order: workspace, frontend, env, infra, database, backend, runtime, api, auth, payments, deploy, addons, examples, then turbo, nx, vite-plus config files.

`workspace-deps.ts` links `@<project>/config|db|auth|api|ui|backend` with `workspace:*` (npm uses `*`) only when that package’s `package.json` exists in the VFS. It also adds shared `zod` + `typescript` + runtime types to every present package.

`db-deps.ts` is the pattern for a dimension: prisma vs drizzle vs mongoose, then database × dbSetup adapters (libsql, d1, neon, pg, planetscale).

Task-runner JSON is generated, not templated:

- `processors/turbo-generator.ts` writes `turbo.json` (tasks grow with db, docker, D1, Alchemy, electrobun, convex).
- `processors/nx-generator.ts` writes `nx.json`.
- `processors/vite-plus-generator.ts` writes the vite-plus config.

`template-handlers/addons.ts` skips those three addons so they are not also copied from `templates/addons/`.

#### Catalogs — `src/post-process/catalogs.ts`

Skipped for npm. Scans a fixed package-path list (root, apps/server|web|native|desktop|fumadocs|docs, packages/api|db|auth|backend|config|infra|ui). A dependency enters the catalog when it appears in more than one package **and** every copy has the same version. Workspace-scoped names and `workspace:*` are excluded. Bun writes `package.json` `workspaces.catalog` (array workspaces are rewritten to `{ packages, catalog }`). pnpm merges into `pnpm-workspace.yaml` `catalog` (file created if missing). Matching dep ranges are then replaced with `catalog:`. This is why versions live in `dependencyVersionMap` and still show up as a catalog in the generated repo.

#### `bts.jsonc` — `src/bts-config.ts`

Written only if `generate` was given `version`. Shape matches `BetterTStackConfigSchema`: `version`, `createdAt`, `reproducibleCommand`, `addonOptions`, `dbSetupOptions`, and the stack fields (database, orm, backend, runtime, frontend, addons, examples, auth, payments, packageManager, dbSetup, api, webDeploy, serverDeploy). File is JSONC: a comment header naming the `add` command for the chosen package manager, then JSON with `$schema: https://r2.better-t-stack.dev/schema.json`. `utils/reproducible-command.ts` builds `bun|pnpm|npx create …` plus every flag (`--frontend`, `--backend`, `--database`, `--orm`, `--api`, `--auth`, `--payments`, `--addons`, `--examples`, `--db-setup`, deploy, git, package manager, install). This is the fingerprint. It is not a template.

#### ts-morph — surgical, not a whole-tree codemod

- `processors/auth-plugins.ts`: in-memory `Project`, parse `packages/auth/src/index.ts`, add imports, find the `betterAuth(...)` call, append to or create `plugins` (`tanstackStartCookies`, `nextCookies`, `expo`). Write `sourceFile.getFullText()` back to the VFS.
- `processors/pwa-plugins.ts`: same pattern on `apps/web/vite.config.ts` (add `vite-plugin-pwa`, double quotes, two-space indent) plus JSX/document and Next config edits.
- `generators/alchemy/writer.ts`: `CodeBlockWriter` only, to emit `packages/infra/alchemy.run.ts`. Not an AST edit of a template. `AGENTS.md` still cites `templates/packages/infra/alchemy.run.ts.hbs`; at this commit that file is gone and `processAlchemyRun` writes the file from `generators/alchemy/render.ts`.
- `processors/alchemy-plugins.ts`: mostly string edits of framework config for Cloudflare/Prisma, not ts-morph.

Use ts-morph when a fragment must be valid TS that gains an import or a property depending on another dimension. Use Handlebars when the whole file (or a large branch) differs.

#### README, env, Vercel, varlock

- `processors/readme-generator.ts` builds `README.md` from config (stack summary, env steps, db scripts). There is no `README.md.hbs` on the default path.
- `processors/env-vars.ts` writes `apps/server/.env`, or `apps/web/.env` when `backend=self`, plus native `.env`, convex `.env.local`, and a root `.env` for docker compose. Values are computed (auth secret via `crypto.getRandomValues`, localhost URLs, placeholders).
- `post-process/vercel-config.ts` writes `vercel.json` services from `@vercel/build-utils` types when either deploy is Vercel.
- `processors/varlock.ts` runs after env files exist, copies env templates, and adds varlock deps when that addon/path is selected.

#### What stays in the CLI after the VFS is written

`apps/cli/src/helpers/addons/addons-setup.ts` `setupAddons` runs on the real directory: tauri, ultracite, biome (`check` script + `@biomejs/biome` dep — the biome **config** is the template, the dep/script is this step), oxlint, husky, lefthook, starlight, fumadocs, opentui, wxt, skills, mcp, evlog/axiom. skills and mcp shell out to installers; they are not Handlebars trees. `templates/addons/` today is only `biome`, `electrobun`, `husky`, `lefthook`, `pwa`.

Database provisioning (`setupDatabase`) is also post-write. The generator only emits compose files, env vars, and scripts.

---

### 6. How the default stack is authored with no golden monorepo

`apps/cli/src/constants.ts` `DEFAULT_CONFIG_BASE` is the only default-stack record:

- `frontend: ["tanstack-router"]`
- `database: "sqlite"`, `orm: "drizzle"`
- `auth: "better-auth"`, `payments: "none"`
- `addons: ["turborepo"]`, `examples: []`
- `backend: "hono"`, `runtime: "bun"`, `api: "trpc"`
- `dbSetup: "none"`, `webDeploy: "none"`, `serverDeploy: "none"`
- package manager = whatever the user already runs (`getUserPkgManager()`)

`--yes` is that object. Nothing in git is the expanded monorepo. Maintainers edit:

1. The fragment for the cell they are changing (`templates/db/drizzle/sqlite/…`, `templates/api/trpc/…`, `templates/frontend/react/tanstack-router/…`, `templates/auth/better-auth/…`).
2. Or the processor, when the change is a dependency, script, catalog entry, env key, README line, or `turbo.json` task.
3. A new pin goes in `dependencyVersionMap` only. BTS `AGENTS.md`: when an upstream release breaks a generated build, fix the template for latest; never pin an older dependency (the map’s comments mark the few intentional lags).

`examples: []` means the default app has **no** todo/ai slice. Those are overlays under `templates/examples/{todo,ai}/`, selected by `--examples`. They patch `packages/api`, `packages/db`, and `apps/web`. They are not a second product.

There is no golden→template sync script. Fragments are the source. A combination that has never been generated still typechecks only when a generated-build sample includes it.

---

### 7. Testing tiers (BTS `AGENTS.md`)

| Tier | Where | Proves |
| --- | --- | --- |
| Contract | `apps/cli/test/*.test.ts` | CLI/MCP/oRPC reject bad input and write the right files. Not “output equals this template string”. |
| Generated builds | `apps/cli/test/generated-builds.test.ts`, samples in `generated-builds/samples.ts`, probes in `probes.ts` | `create()` then install, typecheck, build, and named boot checks. Gated by `BTS_BUILD_SAMPLES=1`; CI shards with `BTS_BUILD_SAMPLE_SHARD`. |
| Live | `apps/cli/live-tests` | Browser against real databases/deploys. Not CI; results go in the PR. |

“Never assert that generated output contains text copied from a template.” New stacks are a sample plus an optional probe, not a unit test of a helper. This matches effect-t-stack ADR-0004.

---

### 8. What to mirror in effect-t-stack, and what not to copy

Mirror the maintenance model:

- `packages/template-generator` with `generate(config, templates) → VirtualFileTree`, memfs VFS, `writeTree` in a Node-only entry, embed script so the published CLI does not read the template directory at runtime.
- Templates as dimension prefixes (`base`, frontend, backend/self vs server, db/orm/database, api, packages, auth, addons, examples), copied by prefix, `.hbs` stripped, dotfiles via `_gitignore` style names.
- Handlebars helpers `eq` / `ne` / `and` / `or` / `includes` (add `not` only if a template needs it). Context is the project config, so `{{projectName}}` is the scope. Do not keep a fixed `@ets/*` tree and rename after copy. That rename exists because golden is a concrete monorepo; BTS never has one.
- One pin table (today’s Dependency Catalog) read by `addPackageDependency`, then a catalog pass that emits Bun `workspaces.catalog` and rewrites ranges to `catalog:`. npm skips the catalog, same as BTS.
- Scripts and `turbo.json` computed from a `DbScriptSupport`-style function and the task-runner addon, not committed as the golden root `package.json`.
- Fingerprint (`ets.jsonc`) written by code at the end of `generate`, with `reproducibleCommand`, and only when a CLI version is passed. Same fields idea as `bts.jsonc`.
- README and `.env` generated from config.
- ts-morph only for splices (plugin arrays, vite config), not as the template engine.
- `add` seeds a VFS from the existing project and runs the same addon processors.
- Default stack is a config constant. For effect-t-stack that constant stays: `api=rpc`, HttpApi secondary, Bun, SQLite, Drizzle, auth none, TanStack Start, effect-style on, and the todo slice included (BTS’s default `examples` is empty; effect-t-stack’s `--yes` todo is part of the default, so the constant should select the todo overlay or the todo files should live on the default api/frontend prefixes).
- Proof: contract tests plus a `--yes` generated-build. No template-text snapshots.

Do not copy BTS product choices:

- Package spine stays Effect Core: `domain | protocol | db | client | config`, not BTS `packages/api` + `packages/auth` + `packages/ui`.
- BTS default (hono, trpc, tanstack-router, better-auth, examples empty) is not the effect-t-stack default.
- `processPostGeneration` is not the pipeline.
- Some addons stay CLI post-steps after `writeTree` (BTS skills, mcp, fumadocs, starlight, tauri). effect-style’s dprint/oxlint/lefthook configs can be templates; `repos` and `language-service` need an explicit choice later (template files vs a post-step). They are not a reason to keep `examples/golden` as source of truth.
- Alchemy, Vercel services, and native `appId` helpers are BTS-specific. Omit them until a deploy/native ticket exists.

`examples/golden` is the current concrete monorepo that the CLI copies. Under this model it is extraction input for the first templates, then it goes away. After that, the default stack is authored the way BTS authors `DEFAULT_CONFIG` plus `templates/**`: edit the fragment or the processor, and let a generated-build prove `--yes`.

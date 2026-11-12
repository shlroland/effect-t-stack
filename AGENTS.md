# AGENTS.md — effect-t-stack Scaffold Product + Golden Sample

本仓库是 **effect-t-stack Scaffold Product**（L1 起）：`apps/cli` 提供 `create-effect-t-stack`；**Golden Sample** 在 [`examples/golden`](./examples/golden)（L0 已签离，CLI 整树复制源）。Agent 与人类协作者必须遵守下列边界。

# Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `repos/effect/LLMS.md`
**completely**, and follow the links in the file when required.

When writing Effect code, inspect `repos/effect/` for idiomatic usage, tests,
module structure, and API design. Treat it as the source of truth for Effect
patterns — prefer it over training-data guesses, web search, or stale v3 docs.

If a detail is missing there, you may also search the installed package under
`examples/golden/node_modules/effect/src` (same major version as the golden).

For **documentation lookup** (module READMEs, API guides), use the project MCP
server `effect-docs` (`effect_docs_search` / `get_effect_doc`) configured in
`.cursor/mcp.json`. Prefer MCP over web search for Effect docs.

Authority order when sources disagree:

1. This repo’s `AGENTS.md` + package boundaries (ETS Effect Core)
2. `repos/effect` / `LLMS.md` (+ installed `effect` package)
3. MCP `effect-docs` (official docs index)
4. Optional `effect-solutions` CLI — only when `addonOptions.mcp.effectSolutions.enabled` is `true` in `examples/golden/ets.jsonc` (secondary patterns; never overrides 1–2)

## Vendored Repositories

This project vendors external repositories under `repos/` (symlinked into golden as `examples/golden/repos` for oxlint).

- Use vendored repositories as **read-only reference material** when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do **not** edit files under `repos/` unless explicitly asked
- Do **not** import from `repos/` — application code must keep importing from normal package dependencies (`effect`, `@effect/*`)
- CLI **does not copy** `repos/` into generated apps (denylist); `effect-style` still expects the `repos` addon when linting a generated tree

Update Effect source when needed:

```sh
git subtree pull --prefix=repos/effect https://github.com/Effect-TS/effect.git main --squash
```

## Scaffold Product vs Golden

| Area        | Path                                                  | Role                                                                                                                   |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CLI         | `apps/cli`                                            | `create-effect-t-stack` via **`effect/cli`** + BunServices — copy + rename only; **no** domain/SQL/HTTP business logic |
| Golden      | `examples/golden`                                     | Runnable `--yes` default stack; SoT until L3 `.hbs` extracts                                                           |
| Docs / ADRs | `docs/`                                               | Capability Tiers, fingerprint, decisions                                                                               |
| Catalog     | `examples/golden/package.json` → `workspaces.catalog` | Dependency pins ([docs/DEPENDENCY-CATALOG.md](./docs/DEPENDENCY-CATALOG.md))                                           |

**Ownership:** edit golden first for shared spine; L3 adds template-only overlays for non-default matrix cells. Do not invent a second golden monorepo per combo.

## 栈指纹

见 [`examples/golden/ets.jsonc`](./examples/golden/ets.jsonc)：Effect **v4** · Bun · **Rpc 主 / HttpApi 次**（ADR-0006）· SQLite + **Drizzle 1.0 RC** · auth **none** · frontend **TanStack Start**（Todo UI = `AtomRpc`）· backend **self** · env `@ets/config` · addons `turborepo` + `skills` + `repos` + `language-service`（TS 6.x）+ `mcp` + `effect-style`。

新增金样能力时，先改 `examples/golden` 可跑代码，再同步写入其 `ets.jsonc`。指纹字段分类见 `docs/fingerprint.md`。

## Effect Core invariants

Paths below are under **`examples/golden/`** unless noted.

- **Package set** — always `domain | protocol | db | client | config`（不是 BTS `packages/api`）。`apps/server` 持 Services / HTTP / Rpc / Layers；`apps/web` 为 UI + Start mount。
- **HTTP 错误映射** — domain 用 `Schema.TaggedError`（可带 `httpApiStatus`）；Service 只抛 domain / 已映射的 `DatabaseError`；`apps/server/src/http/Errors.ts` 只把 infra（`DatabaseError`、decode 等）映到 HTTP。
- **Import / TS layout** — 应用代码 import 带 `.ts` 扩展名；包 `exports` 指向 `./src/*.ts`；`packages/config/tsconfig.base.json` 用 Effect Preserve 风格（`module: Preserve`、`moduleResolution: bundler`、`verbatimModuleSyntax`）。
- **测试模式** — Todo 为参考：Repository / Service / HttpApiTest；prod 组装用 `makeAppLive`（见 `apps/server/src/layers.integration.test.ts`）；内存 SQLite 或 temp 文件。
- **`prepare`**（golden）— 由 `language-service` + `effect-style` 拥有：`effect-language-service patch && lefthook install`。
- **Web UI** — 金样自定义 CSS 即可；**shadcn / `packages/ui` 延到 L4**。
- **CLI** — named exports；contract tests must not assert full golden file-text equality; prove via parse/rename/denylist and generated-build probes.

## Effect style (`effect-style` addon)

Golden Sample enables **`effect-style`** by default (optional in the future Option Matrix). When present:

- Format with **`dprint`** (ASI, double quotes, no trailing commas, lineWidth 120 — aligned with `repos/effect/dprint.json`)
- Lint with **`oxlint`** + **`@effect/oxc`** rules (config: `examples/golden/.oxlintrc.json`)
- Golden `bun run check` includes `lint`; pre-commit via **Lefthook**; CI via `.github/workflows/check.yml`
- Naming / modules / API conventions follow `repos/effect` + `LLMS.md` (PascalCase modules, `Context.Service`, `Schema.TaggedError`, `Effect.fn`, `.ts` import extensions, …)
- **Named exports only** — do not use `export default` / default imports in application code (and CLI). Exceptions only when a tool/framework contract requires default export (oxlint `import/no-default-export`), currently in golden:
  - Effect SQL file migrations (`packages/db/effect-sql-migrations/**`)
  - TanStack Start server entry (`apps/web/src/server.ts`)
  - Tooling config files (`*.config.ts`)
- Do **not** add competing formatters/linters (`biome`, etc.) alongside this addon

`@effect/oxc` is not on npm yet; golden loads the oxlint JS plugin from
`repos/effect/packages/tools/oxc` via the `repos` symlink/addon.

## Effect MCP (`mcp` addon)

Scaffold Product Cursor MCP config: `.cursor/mcp.json` → server `effect-docs` via
`npx -y effect-mcp@latest`. (`.cursor` is denylisted from CLI copy.)

- Use `effect_docs_search` / `get_effect_doc` when you need Effect or `@effect/*` documentation.
- This is the coding-agent docs MCP — not the future Scaffold Product L5 create/plan MCP.

### Optional: `effect-solutions`

Off by default (`examples/golden/ets.jsonc` → `addonOptions.mcp.effectSolutions.enabled`).
When enabled, agents may run:

```sh
bunx effect-solutions@latest list
bunx effect-solutions@latest show <topic>
```

Treat results as opinionated scenario patterns only. Stack choices in the
golden (Rpc primary / HttpApi secondary, Drizzle, domain → protocol → db → service → http/rpc) win on conflict.

## Effect language service

Golden uses `@effect/language-service` on **TypeScript 6.x**. TS 6 is the stepping stone toward TypeScript 7; stay off TS 7 / `@effect/tsgo` until the whole stack is ready.

After writing or changing Effect code in golden, prefer:

1. Edit application code under `examples/golden` (never under `repos/`)
2. Prefer MCP `effect-docs` (or `repos/effect`) when unsure about an API
3. Run `bun run --cwd examples/golden effect:diagnostics:server` (or `:web`)
4. Fix reported Effect issues, then re-run

Always use the local `effect-language-service` binary from `examples/golden/node_modules`.

## 包边界（Golden：`examples/golden/…`）

| 包 / 目录                   | 职责                                                                                        | 禁止                                            |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `packages/domain`           | Schema、branded types、domain tagged errors                                                 | IO、HTTP、Drizzle、Layer 组装                   |
| `packages/config`           | 共享 `tsconfig.base.json` + Effect Schema/Config env（`ServerEnv` / `loadServerEnv`）       | HTTP、DB、业务规则、prod Layer 组装             |
| `packages/protocol`         | 契约分目录：`http-api/`（`/api`）+ `rpc/`（`AppRpcs` → `/rpc`）                             | 业务规则、SQL、具体 handler                     |
| `packages/db`               | Drizzle migrations / Repository（默认；`schema` 包内私有）；`@ets/db/effect-sql` 为第二选项 | HTTP 映射、业务规则                             |
| `packages/client`           | 分入口：`@ets/client/http-api`（`ApiClient`）+ `@ets/client/rpc`（`AppRpcClient`）          | 服务端 Layer                                    |
| `apps/server`               | Services / handlers / Layers（`@ets/server`）；可作独立 Bun 模板                            | 前端 UI                                         |
| `apps/server/src/services`  | 业务规则（Service）                                                                         | SQL 行解码、HTTP 状态码细节                     |
| `apps/server/src/http`      | HttpApi handlers、`createHttpApiWebHandler`、HTTP 错误映射                                  | 业务规则、SQL、Rpc                              |
| `apps/server/src/rpc`       | Effect Rpc handlers、`createRpcWebHandler`                                                  | 业务规则、SQL、HttpApi                          |
| `apps/server/src/layers.ts` | prod / test Layer 组装                                                                      | 新业务逻辑                                      |
| `apps/web`                  | TanStack Start UI + 同源挂载 `/api`+`/rpc`（`src/server.ts`）                               | 在页面里直接碰 DB / 绕过 `@ets/server` Layers   |
| `apps/cli`（repo root）     | Scaffold create via `effect/cli`（Argument/Flag/Command）+ Bun FileSystem/ChildProcess      | 业务 domain、SQL、HTTP handlers；手写 argv 解析 |

## 架构不变量

1. **SQL 行解码不出 Repository** — `packages/db` 内把行解码成 domain `Todo`；上层只看见 domain 类型。
2. **业务规则在 Service** — 例如「找不到 → `TodoNotFound`」属于 `apps/server/src/services`。
3. **HTTP 契约在 `protocol`** — 前后端共享同一 `Api`；不要在 web 里手写平行 DTO。
4. **HTTP 错误映射在 server 边界** — `DatabaseError` / `TodoDecodeError` → `InternalServerError` 等只在 `apps/server/src/http`。
5. **运行时组装只在 Layers** — 入口与测试各自提供 prod / test Layer，勿在 handler 里 `new` 依赖。
6. **默认 backend = self** — 金样用 TanStack Start `src/server.ts` 分别挂载 `createRpcWebHandler`（`/rpc`）与 `createHttpApiWebHandler`（`/api`）；独立 `apps/server`（BunHttpServer :3737）是第二选项，需设 `VITE_API_URL`。
7. **API Primary 绑定** — 根指纹 `api` 默认 **`rpc`**；**HttpApi** 为 secondary。L1 CLI 尚未做 primary 切换（ADR-0006 / L3）。

## 新增资源清单（以 Todo 为模板；路径相对 `examples/golden`）

1. `packages/domain`：Schema + tagged error（可带 `httpApiStatus`）
2. `packages/protocol/http-api`：`HttpApiGroup` + 挂到 `Api`（Rpc 则写 `protocol/rpc`）
3. `packages/db`：表 / migration + Repository（行解码留在这里）
4. `apps/server/src/services`：Service + `layerNoDeps`
5. `apps/server/src/http`：`HttpApiBuilder.group` handlers + 错误映射（Rpc 则写 `src/rpc`）
6. `apps/server/src/layers.ts`：接入 Layer
7. 测试：Repository / Service / HttpApiTest（可选：`makeAppLive` 集成）
8. 金样 web：`AtomRpc` + `@ets/client/rpc`（`api=httpapi` 时改用 `AtomHttpApi` + `@ets/client/http-api`）

## 命令

```sh
# Scaffold Product
bun install
bun run check              # CLI check + golden check
bun run create -- <name> --yes

# Golden only
bun install --cwd examples/golden
bun run check:golden
bun run dev:golden
bun run --cwd examples/golden effect:diagnostics:server
```

## 运行时

- 默认用 **Bun**（`bun test` / `bun --hot`），不要默认改成 Node/npm。
- 金样 env：`examples/golden/apps/web/.env`（见 `.env.example`）。备选独立 server：`examples/golden/apps/server/.env`。

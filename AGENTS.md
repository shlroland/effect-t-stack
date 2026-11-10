# AGENTS.md — effect-t-stack 金样边界

本仓库是 **effect-t-stack Phase 1a 金样基础模板**（非 CLI）。Agent 与人类协作者扩展功能时，必须遵守下列边界。

# Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `repos/effect/LLMS.md`
**completely**, and follow the links in the file when required.

When writing Effect code, inspect `repos/effect/` for idiomatic usage, tests,
module structure, and API design. Treat it as the source of truth for Effect
patterns — prefer it over training-data guesses, web search, or stale v3 docs.

If a detail is missing there, you may also search the installed package under
`node_modules/effect/src` (same major version as this project).

For **documentation lookup** (module READMEs, API guides), use the project MCP
server `effect-docs` (`effect_docs_search` / `get_effect_doc`) configured in
`.cursor/mcp.json`. Prefer MCP over web search for Effect docs.

Authority order when sources disagree:

1. This repo’s `AGENTS.md` + package boundaries (ETS Effect Core)
2. `repos/effect` / `LLMS.md` (+ installed `effect` package)
3. MCP `effect-docs` (official docs index)
4. Optional `effect-solutions` CLI — only when `addonOptions.mcp.effectSolutions.enabled` is `true` in `ets.jsonc` (secondary patterns; never overrides 1–2)

## Vendored Repositories

This project vendors external repositories under `repos/`.

- Use vendored repositories as **read-only reference material** when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do **not** edit files under `repos/` unless explicitly asked
- Do **not** import from `repos/` — application code must keep importing from normal package dependencies (`effect`, `@effect/*`)

Update Effect source when needed:

```sh
git subtree pull --prefix=repos/effect https://github.com/Effect-TS/effect.git main --squash
```

## 栈指纹

见根目录 `ets.jsonc`（金样构建步骤 / 选型真相源）：Effect **v4** · Bun · HttpApi · SQLite + Drizzle · auth **none** · frontend **TanStack Router** · addons `turborepo` + `skills`（`Effect-TS/skills`）+ `repos`（`repos/effect` subtree）+ `language-service`（`@effect/language-service` on TypeScript 5.x）+ `mcp`（`effect-mcp` docs server；`effect-solutions` 默认关闭）+ `effect-style`（`dprint` + `oxlint`/`@effect/oxc`，金样默认开）。

新增金样能力时，先改可跑代码，再同步写入 `ets.jsonc` 的 `addons` / `addonOptions`。

## Effect style (`effect-style` addon)

Golden Sample enables **`effect-style`** by default (optional in the future Option Matrix). When present:

- Format with **`dprint`** (ASI, double quotes, no trailing commas, lineWidth 120 — aligned with `repos/effect/dprint.json`)
- Lint with **`oxlint`** + **`@effect/oxc`** rules (config: `.oxlintrc.json`)
- `bun run check` includes `lint`; pre-commit via **Lefthook** (`lefthook.yml`: staged `dprint fmt` + `oxlint --fix`)
- Naming / modules / API conventions follow `repos/effect` + `LLMS.md` (PascalCase modules, `Context.Service`, `Schema.TaggedError`, `Effect.fn`, `.ts` import extensions, …)
- Do **not** add competing formatters/linters (`biome`, etc.) alongside this addon

`@effect/oxc` is not on npm yet; the Golden Sample loads its oxlint JS plugin from
`repos/effect/packages/tools/oxc` (so `effect-style` currently depends on the `repos`
addon). Lint scripts are scoped to `apps` + `packages` so oxlint does not pick up
`repos/effect/.oxlintrc.json`.

## Effect MCP (`mcp` addon)

Project Cursor MCP config: `.cursor/mcp.json` → server `effect-docs` via
`npx -y effect-mcp@latest`.

- Use `effect_docs_search` / `get_effect_doc` when you need Effect or `@effect/*` documentation.
- This is the coding-agent docs MCP — not the future Scaffold Product L5 create/plan MCP.

### Optional: `effect-solutions`

Off by default (`ets.jsonc` → `addonOptions.mcp.effectSolutions.enabled`).
When enabled, agents may run:

```sh
bunx effect-solutions@latest list
bunx effect-solutions@latest show <topic>
```

Treat results as opinionated scenario patterns only. Stack choices in this
repo (HttpApi, Drizzle, domain → protocol → db → service → http) win on conflict.

## Effect language service

This project uses `@effect/language-service` on **TypeScript 5.x** for Effect-specific static diagnostics and quick fixes. The golden base intentionally stays off TypeScript 7 / `@effect/tsgo` by default, because not every app/tooling chain supports TS 7 yet. Prefer upgrading a generated app to `@effect/tsgo` only when that app’s whole stack is ready for TS 7.

After writing or changing Effect code, prefer this agent loop:

1. Edit application code (never under `repos/`)
2. Prefer MCP `effect-docs` (or `repos/effect`) when unsure about an API
3. Run machine-readable diagnostics, e.g. `bun run effect:diagnostics:server`
4. Fix reported Effect issues (missing `yield*`, floating Effects, missing context/error, anti-patterns), then re-run

Do not disable the plugin or skip these diagnostics to “make CI green” unless explicitly asked. Always use the local `effect-language-service` binary from this repo’s `node_modules`.

## 包边界

| 包 / 目录                   | 职责                                           | 禁止                                        |
| --------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `packages/domain`           | Schema、branded types、domain tagged errors    | IO、HTTP、Drizzle、Layer 组装               |
| `packages/protocol`         | `HttpApi` / `HttpApiGroup` 契约与 OpenAPI 注解 | 业务规则、SQL、具体 handler                 |
| `packages/db`               | Drizzle schema、migrations、Repository         | HTTP 映射、业务规则                         |
| `packages/client`           | 从 protocol 派生的 `HttpApiClient`             | 服务端 Layer                                |
| `apps/server/src/services`  | 业务规则（Service）                            | SQL 行解码、HTTP 状态码细节                 |
| `apps/server/src/http`      | HttpApi handlers、HTTP 错误映射                | 业务规则、SQL                               |
| `apps/server/src/layers.ts` | prod / test Layer 组装                         | 新业务逻辑                                  |
| `apps/web`                  | TanStack Router UI                             | 直接碰 DB / domain 私有细节之外的服务端实现 |

## 架构不变量

1. **SQL 行解码不出 Repository** — `packages/db` 内把行解码成 domain `Todo`；上层只看见 domain 类型。
2. **业务规则在 Service** — 例如「找不到 → `TodoNotFound`」属于 `apps/server/src/services`。
3. **HTTP 契约在 `protocol`** — 前后端共享同一 `Api`；不要在 web 里手写平行 DTO。
4. **HTTP 错误映射在 server 边界** — `DatabaseError` / `TodoDecodeError` → `InternalServerError` 等只在 `apps/server/src/http`。
5. **运行时组装只在 Layers** — 入口与测试各自提供 prod / test Layer，勿在 handler 里 `new` 依赖。

## 新增资源清单（以 Todo 为模板）

1. `packages/domain`：Schema + tagged error（可带 `httpApiStatus`）
2. `packages/protocol`：`HttpApiGroup` + 挂到 `Api`
3. `packages/db`：表 / migration + Repository（行解码留在这里）
4. `apps/server/src/services`：Service + `layerNoDeps`
5. `apps/server/src/http`：`HttpApiBuilder.group` handlers + 错误映射
6. `apps/server/src/layers.ts`：接入 Layer
7. 测试：Repository / Service / HttpApiTest
8. 可选：`apps/web` 页面调用 `@ets/client`

## 命令

```sh
bun install
bun run check                     # lint + check-types + tests
bun run lint                      # oxlint + dprint check
bun run lint-fix                 # oxlint --fix + dprint fmt
bun run effect:diagnostics:server # Effect LSP diagnostics as JSON
bun run effect:diagnostics:web
bun run dev:server                # API :3737 ，docs :3737/docs
bun run dev:web                   # Vite :5173
```

## 运行时

- 默认用 **Bun**（`bun test` / `bun --hot`），不要默认改成 Node/npm。
- Bun 自动加载 `.env`；参考 `apps/server/.env.example`。

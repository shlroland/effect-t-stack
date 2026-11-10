# AGENTS.md — effect-t-stack 金样边界

本仓库是 **effect-t-stack Phase 1a 金样基础模板**（非 CLI）。Agent 与人类协作者扩展功能时，必须遵守下列边界。

# Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `node_modules/effect/AGENTS.md`
**completely**, and follow the links in the file when required.

If you need to learn more about particular Effect apis and concepts that the
guide doesn't cover, search through the source code in `node_modules/effect/src`.

## 栈指纹

见根目录 `ets.jsonc`（金样构建步骤 / 选型真相源）：Effect **v4** · Bun · HttpApi · SQLite + Drizzle · auth **none** · frontend **TanStack Router** · addons `turborepo` + `skills`（`Effect-TS/skills`）。

新增金样能力时，先改可跑代码，再同步写入 `ets.jsonc` 的 `addons` / `addonOptions`。

## 包边界

| 包 / 目录 | 职责 | 禁止 |
|-----------|------|------|
| `packages/domain` | Schema、branded types、domain tagged errors | IO、HTTP、Drizzle、Layer 组装 |
| `packages/protocol` | `HttpApi` / `HttpApiGroup` 契约与 OpenAPI 注解 | 业务规则、SQL、具体 handler |
| `packages/db` | Drizzle schema、migrations、Repository | HTTP 映射、业务规则 |
| `packages/client` | 从 protocol 派生的 `HttpApiClient` | 服务端 Layer |
| `apps/server/src/services` | 业务规则（Service） | SQL 行解码、HTTP 状态码细节 |
| `apps/server/src/http` | HttpApi handlers、HTTP 错误映射 | 业务规则、SQL |
| `apps/server/src/layers.ts` | prod / test Layer 组装 | 新业务逻辑 |
| `apps/web` | TanStack Router UI | 直接碰 DB / domain 私有细节之外的服务端实现 |

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
bun run check          # check-types + tests
bun run dev:server     # API :3737 ，docs :3737/docs
bun run dev:web        # Vite :5173
```

## 运行时

- 默认用 **Bun**（`bun test` / `bun --hot`），不要默认改成 Node/npm。
- Bun 自动加载 `.env`；参考 `apps/server/.env.example`。

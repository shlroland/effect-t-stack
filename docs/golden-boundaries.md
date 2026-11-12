# Golden Sample package boundaries

Paths below are under **`examples/golden/`** unless noted. Scaffold Product CLI lives at repo-root `apps/cli` and must not grow domain/SQL/HTTP business logic.

## Package set

| 包 / 目录                   | 职责                                                                                        | 禁止                                          |
| --------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `packages/domain`           | Schema、branded types、domain tagged errors                                                 | IO、HTTP、Drizzle、Layer 组装                 |
| `packages/config`           | 共享 `tsconfig.base.json` + Effect Schema/Config env（`ServerEnv` / `loadServerEnv`）       | HTTP、DB、业务规则、prod Layer 组装           |
| `packages/protocol`         | 契约分目录：`http-api/`（`/api`）+ `rpc/`（`AppRpcs` → `/rpc`）                             | 业务规则、SQL、具体 handler                   |
| `packages/db`               | Drizzle migrations / Repository（默认；`schema` 包内私有）；`@ets/db/effect-sql` 为第二选项 | HTTP 映射、业务规则                           |
| `packages/client`           | 分入口：`@ets/client/http-api`（`ApiClient`）+ `@ets/client/rpc`（`AppRpcClient`）          | 服务端 Layer                                  |
| `apps/server`               | Services / handlers / Layers（`@ets/server`）；可作独立 Bun 模板                            | 前端 UI                                       |
| `apps/server/src/services`  | 业务规则（Service）                                                                         | SQL 行解码、HTTP 状态码细节                   |
| `apps/server/src/http`      | HttpApi handlers、`createHttpApiWebHandler`、HTTP 错误映射                                  | 业务规则、SQL、Rpc                            |
| `apps/server/src/rpc`       | Effect Rpc handlers、`createRpcWebHandler`                                                  | 业务规则、SQL、HttpApi                        |
| `apps/server/src/layers.ts` | prod / test Layer 组装                                                                      | 新业务逻辑                                    |
| `apps/web`                  | TanStack Start UI + 同源挂载 `/api`+`/rpc`（`src/server.ts`）                               | 在页面里直接碰 DB / 绕过 `@ets/server` Layers |

Always `domain | protocol | db | client | config`（不是 BTS `packages/api`）。

## Architecture invariants

1. **SQL 行解码不出 Repository** — `packages/db` 内把行解码成 domain `Todo`；上层只看见 domain 类型。
2. **业务规则在 Service** — 例如「找不到 → `TodoNotFound`」属于 `apps/server/src/services`。
3. **HTTP 契约在 `protocol`** — 前后端共享同一 `Api`；不要在 web 里手写平行 DTO。
4. **HTTP 错误映射在 server 边界** — `DatabaseError` / `TodoDecodeError` → `InternalServerError` 等只在 `apps/server/src/http`。
5. **运行时组装只在 Layers** — 入口与测试各自提供 prod / test Layer，勿在 handler 里 `new` 依赖。
6. **默认 backend = self** — TanStack Start `src/server.ts` 挂载 Rpc（`/rpc`）与 HttpApi（`/api`）；独立 `apps/server`（BunHttpServer :3737）是第二选项，需设 `VITE_API_URL`。
7. **API Primary** — 根指纹 `api` 默认 **`rpc`**；HttpApi 为 secondary。Primary flip 完整性在 L3（[ADR-0006](./adr/0006-api-primary-rpc-with-httpapi-secondary.md)）。

## Effect Core layout notes

- **HTTP 错误映射** — domain 用 `Schema.TaggedError`（可带 `httpApiStatus`）；Service 只抛 domain / 已映射的 `DatabaseError`；`apps/server/src/http/Errors.ts` 只把 infra 映到 HTTP。
- **Import / TS** — 应用代码 import 带 `.ts` 扩展名；包 `exports` 指向 `./src/*.ts`；`packages/config/tsconfig.base.json` 用 Effect Preserve 风格。
- **测试** — Todo 为参考：Repository / Service / HttpApiTest；prod 组装用 `makeAppLive`；内存 SQLite 或 temp 文件。
- **`prepare`** — `language-service` + `effect-style`：`effect-language-service patch && lefthook install`。
- **Web UI** — 自定义 CSS；**shadcn / `packages/ui` 延到 L4**。

## 新增资源清单（以 Todo 为模板）

1. `packages/domain`：Schema + tagged error（可带 `httpApiStatus`）
2. `packages/protocol/http-api`：`HttpApiGroup` + 挂到 `Api`（Rpc 则写 `protocol/rpc`）
3. `packages/db`：表 / migration + Repository（行解码留在这里）
4. `apps/server/src/services`：Service + `layerNoDeps`
5. `apps/server/src/http`：`HttpApiBuilder.group` handlers + 错误映射（Rpc 则写 `src/rpc`）
6. `apps/server/src/layers.ts`：接入 Layer
7. 测试：Repository / Service / HttpApiTest（可选：`makeAppLive` 集成）
8. 金样 web：`AtomRpc` + `@ets/client/rpc`（`api=httpapi` 时改用 `AtomHttpApi` + `@ets/client/http-api`）

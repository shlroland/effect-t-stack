# effect-t-stack（金样基础模板）

Effect **v4** 全栈脚手架的 **L0 Golden Sample**（已签离，可被未来 CLI 复制）：可运行 monorepo；Scaffold CLI 属于 L1，尚未包含。

## 默认栈

| 维度     | 选择                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Runtime  | Bun                                                                           |
| API      | Effect Rpc `/rpc`（主）；Effect HttpApi `/api`（次，OpenAPI）；Start 同源托管 |
| DB / ORM | SQLite + Drizzle（Effect SQL 为 `@ets/db/effect-sql` 第二选项）               |
| Auth     | none                                                                          |
| Frontend | TanStack Start                                                                |
| Backend  | self（`apps/web`）；备选 `apps/server`                                        |
| Monorepo | turborepo                                                                     |

## 快速开始

```sh
bun install
cp apps/web/.env.example apps/web/.env
bun run check
bun run dev          # http://localhost:5173  · UI (AtomRpc) · Rpc `/rpc` · HttpApi `/api` · docs: /api/docs
```

备选：单独起 Bun server（`:3737`），并在 web 设 `VITE_API_URL=http://localhost:3737`：

```sh
cp apps/server/.env.example apps/server/.env
bun run dev:server
```

## 目录

```
apps/web        TanStack Start（UI = AtomRpc；同源挂载 `/rpc` + `/api`）
apps/server     Services/Layers；Rpc + HttpApi handlers；亦可作独立 Bun 模板
packages/domain Schema / branded types / domain errors
packages/protocol `rpc/`（`AppRpcs` → `/rpc` 主）+ `http-api/`（`/api` 次）
packages/db     Drizzle schema / migrations / repositories（可选 `@ets/db/effect-sql`）
packages/client `@ets/client/rpc` + `@ets/client/http-api`
packages/config 共享 tsconfig + ServerEnv
```

架构边界见 [`AGENTS.md`](./AGENTS.md)；选型指纹见 [`ets.jsonc`](./ets.jsonc)；API primary 决策见 [`docs/adr/0006-api-primary-rpc-with-httpapi-secondary.md`](./docs/adr/0006-api-primary-rpc-with-httpapi-secondary.md)。

## 示例 API（HttpApi secondary）

```sh
curl http://localhost:5173/api/health
curl -X POST http://localhost:5173/api/todos \
  -H 'content-type: application/json' \
  -d '{"title":"ship the starter"}'
curl http://localhost:5173/api/todos
```

Todo UI 走 Effect Rpc `/rpc`（NDJSON）via `AtomRpc` / `@ets/client/rpc`；HttpApi 用 `@ets/client/http-api`（OpenAPI：`/api/docs`）。

## 许可

MIT

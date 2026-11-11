# effect-t-stack（金样基础模板）

Effect **v4** 全栈脚手架的 Phase 1a 金样：可运行 monorepo，CLI 尚未包含。

## 默认栈

| 维度     | 选择                                                            |
| -------- | --------------------------------------------------------------- |
| Runtime  | Bun                                                             |
| API      | Effect HttpApi（TanStack Start 同源托管；独立 Bun server 可选） |
| DB / ORM | SQLite + Drizzle（Effect SQL 为 `@ets/db/effect-sql` 第二选项） |
| Auth     | none                                                            |
| Frontend | TanStack Start                                                  |
| Backend  | self（`apps/web`）；备选 `apps/server`                          |
| Monorepo | turborepo                                                       |

## 快速开始

```sh
bun install
cp apps/web/.env.example apps/web/.env
bun run check
bun run dev          # http://localhost:5173  · UI + HttpApi `/api` · docs: /api/docs
```

备选：单独起 Bun HttpApi（`:3737`），并在 web 设 `VITE_API_URL=http://localhost:3737`：

```sh
cp apps/server/.env.example apps/server/.env
bun run dev:server
```

## 目录

```
apps/web        TanStack Start（UI + 同源 HttpApi 挂载）
apps/server     HttpApi Services/Layers；亦可作独立 Bun 模板
packages/domain Schema / branded types / domain errors
packages/protocol 共享 HttpApi 契约（统一前缀 `/api`）
packages/db     Drizzle schema / migrations / repositories（可选 `@ets/db/effect-sql`）
packages/client 从 protocol 派生的 typed client
packages/config 共享 tsconfig + ServerEnv
```

架构边界见 [`AGENTS.md`](./AGENTS.md)；选型指纹见 [`ets.jsonc`](./ets.jsonc)。

## 示例 API

```sh
curl http://localhost:5173/api/health
curl -X POST http://localhost:5173/api/todos \
  -H 'content-type: application/json' \
  -d '{"title":"ship the starter"}'
curl http://localhost:5173/api/todos
```

## 许可

MIT

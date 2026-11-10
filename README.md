# effect-t-stack（金样基础模板）

Effect **v4** 全栈脚手架的 Phase 1a 金样：可运行 monorepo，CLI 尚未包含。

## 默认栈

| 维度     | 选择             |
| -------- | ---------------- |
| Runtime  | Bun              |
| API      | Effect HttpApi   |
| DB / ORM | SQLite + Drizzle |
| Auth     | none             |
| Frontend | TanStack Router  |
| Monorepo | turborepo        |

## 快速开始

```sh
bun install
cp apps/server/.env.example apps/server/.env
bun run check
bun run dev:server   # http://localhost:3737  · docs: /docs · openapi: /openapi.json
bun run dev:web      # http://localhost:5173
```

## 目录

```
apps/server     HttpApi handlers + Services + Layers
apps/web        TanStack Router 前端
packages/domain Schema / branded types / domain errors
packages/protocol 共享 HttpApi 契约
packages/db     Drizzle schema / migrations / repositories
packages/client 从 protocol 派生的 typed client
packages/config 共享 tsconfig
```

架构边界见 [`AGENTS.md`](./AGENTS.md)；选型指纹见 [`ets.jsonc`](./ets.jsonc)。

## 示例 API

```sh
curl http://localhost:3737/health
curl -X POST http://localhost:3737/todos \
  -H 'content-type: application/json' \
  -d '{"title":"ship the starter"}'
curl http://localhost:3737/todos
```

## 许可

MIT

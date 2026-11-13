# effect-t-stack

Effect **v4** Scaffold Product for **`create-effect-t-stack`**. Generated apps come from [`packages/template-generator`](./packages/template-generator) ([ADR-0007](./docs/adr/0007-templates-are-the-source-of-truth.md)). L1 and L2 are closed. The default stack is the L3 exit; other Option Matrix cells are backlog.

## Layout

```
apps/cli                       create-effect-t-stack
packages/template-generator   Handlebars source of truth for create
packages/effect-oxc           owned copy of unpublished @effect/oxc
docs/                         ADRs, Capability Tiers, fingerprint guide
repos/effect                  vendored Effect reference (not copied into generated apps)
```

## Create a project (CLI)

From the Scaffold Product root (after `bun install`):

```sh
bun run create -- my-app --yes --no-git
# or interactive (prompts for name / confirm):
bun run create --
# agents:
bun run create -- my-app --yes --verbose --no-render-title
# after npm publish:
bunx create-effect-t-stack@latest my-app --yes
```

This generates `./my-app` from `packages/template-generator` (scope `@my-app/*`) and writes `ets.jsonc`. Notable flags: `--dry-run`, `--package-manager bun|npm|pnpm`, `--directory-conflict`, `--open <bin>`, `--manual-db`. `--api httpapi` / `--no-effect-style` are plumbed but error until L3.

**Requires Bun ≥ 1.4.4.** See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`SECURITY.md`](./SECURITY.md).

Smoke tiers:

```sh
# Generated-build (gated, slow)
ETS_GENERATED_BUILD=1 bun test apps/cli/test/generated-build.smoke.test.ts
# Live CI: Actions → live-smoke (workflow_dispatch / weekly)
```

**L2 (closed):** `add` / `add --package`, `create-json` / `add-json`, `schema`, `history`, fingerprint `$schema`, compatibility engine — see [`docs/fingerprint.md`](./docs/fingerprint.md), [`docs/compatibility.md`](./docs/compatibility.md), [`docs/CAPABILITY-TIERS.md`](./docs/CAPABILITY-TIERS.md).

## Default stack

What `create --yes` emits (written into the generated `ets.jsonc`):

| 维度     | 选择                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Runtime  | Bun                                                                           |
| API      | Effect Rpc `/rpc`（主）；Effect HttpApi `/api`（次，OpenAPI）；Start 同源托管 |
| DB / ORM | SQLite + Drizzle（Effect SQL 为 `@ets/db/effect-sql` 第二选项）               |
| Auth     | none                                                                          |
| Frontend | TanStack Start                                                                |
| Backend  | self（`apps/web`）；备选 `apps/server`                                        |
| Monorepo | turborepo                                                                     |

```sh
bun run create -- my-app --yes --no-git
cd my-app
cp apps/web/.env.example apps/web/.env
bun install
bun run dev    # http://localhost:5173
```

## Ownership

- **Templates** (`packages/template-generator`) are the only product source of truth.
- Edit a fragment or a post-processor, then prove it with a generated-build.
- Other matrix cells are more `.hbs` fragments. Do not add a second sample monorepo.

## Docs

- Boundaries: [`AGENTS.md`](./AGENTS.md) · golden packages: [`docs/golden-boundaries.md`](./docs/golden-boundaries.md)
- CLI layout: [`apps/cli/README.md`](./apps/cli/README.md)
- Tiers: [`docs/CAPABILITY-TIERS.md`](./docs/CAPABILITY-TIERS.md)
- Fingerprint: [`docs/fingerprint.md`](./docs/fingerprint.md)
- Compatibility: [`docs/compatibility.md`](./docs/compatibility.md)
- Review standards: [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)
- API primary: [`docs/adr/0006-api-primary-rpc-with-httpapi-secondary.md`](./docs/adr/0006-api-primary-rpc-with-httpapi-secondary.md)

## 许可

MIT

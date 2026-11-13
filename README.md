# effect-t-stack

Effect **v4** Scaffold Product for **`create-effect-t-stack`**. L0 Golden Sample is signed off under [`examples/golden`](./examples/golden); **L1 Scaffold MVP** and **L2** (fingerprint / `add` / agent JSON / compatibility engine) are closed. **L3** Option Matrix (`.hbs` + non-default cells) is next.

## Layout

```
apps/cli              create-effect-t-stack (L1 thin MVP)
examples/golden       runnable default-stack sample (create does not copy it)
packages/template-generator   Handlebars source for create
docs/                 ADRs, Capability Tiers, fingerprint guide
repos/effect          vendored Effect reference (not copied into generated apps)
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

## Golden Sample

Default stack (see [`examples/golden/ets.jsonc`](./examples/golden/ets.jsonc)):

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
bun install --cwd examples/golden
cp examples/golden/apps/web/.env.example examples/golden/apps/web/.env
bun run check:golden
bun run dev:golden    # http://localhost:5173
```

## Ownership (golden vs templates)

- **Templates** (`packages/template-generator`) = what `create --yes` emits.
- **Golden** = one runnable default combo that still exists in-repo. Deleting it, and the docs that say "edit golden first", is a later ticket.
- **Other matrix combos** = more `.hbs` cells; prove with generated-builds — not N extra goldens.

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

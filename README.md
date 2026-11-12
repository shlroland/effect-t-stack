# effect-t-stack

Effect **v4** Scaffold Product for **`create-effect-t-stack`**. L0 Golden Sample is signed off and lives under [`examples/golden`](./examples/golden); L1 thin MVP ships a local CLI that whole-tree copies that golden.

## Layout

```
apps/cli              create-effect-t-stack (L1 thin MVP)
examples/golden       runnable default-stack Golden Sample (SoT for --yes)
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
```

This copies `examples/golden` → `./my-app`, renames `@ets/*` → `@my-app/*`, and stamps `ets.jsonc` create meta. Notable flags: `--dry-run`, `--package-manager bun|npm|pnpm`, `--directory-conflict`, `--open <bin>`, `--manual-db`. `--api httpapi` / `--no-effect-style` are plumbed but error until L3.

**Requires Bun ≥ 1.4.4.** See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`SECURITY.md`](./SECURITY.md).

Gated generated-build smoke (slow):

```sh
ETS_GENERATED_BUILD=1 bun test apps/cli/src/generated-build.smoke.test.ts
```

**Why not L2 yet?** Capability Tiers are strict: L2 (`add`, fingerprint `$schema`, `create-json` / agent contract) starts after L1 Scaffold MVP is closed enough to publish and smoke. L2 content is already listed in [`docs/CAPABILITY-TIERS.md`](./docs/CAPABILITY-TIERS.md).

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

- **Golden** = one runnable default combo; edit here first for shared Effect Core spine + Dependency Catalog pins.
- **Other matrix combos** (L3+) = `.hbs` + template-only overlays; prove with generated-builds — not N extra goldens.
- **Sync (L3):** golden → regenerate overlapping templates.

## Docs

- Boundaries: [`AGENTS.md`](./AGENTS.md)
- Tiers: [`docs/CAPABILITY-TIERS.md`](./docs/CAPABILITY-TIERS.md)
- Fingerprint: [`docs/fingerprint.md`](./docs/fingerprint.md)
- API primary: [`docs/adr/0006-api-primary-rpc-with-httpapi-secondary.md`](./docs/adr/0006-api-primary-rpc-with-httpapi-secondary.md)

## 许可

MIT

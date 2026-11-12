# create-effect-t-stack

Scaffold an Effect **v4** app by whole-tree copying the [effect-t-stack](https://github.com/shlroland/effect-t-stack) Golden Sample (`@ets/*` → `@<name>/*`).

## Requirements

- **Bun ≥ 1.4.4**

## Usage

```sh
bunx create-effect-t-stack@latest my-app --yes
# equivalent explicit subcommand:
bunx create-effect-t-stack@latest create my-app --yes
# from a Scaffold Product checkout:
bun run create -- my-app --yes

# L2
bunx create-effect-t-stack add --package billing
bunx create-effect-t-stack schema --name fingerprint
bunx create-effect-t-stack history --json
```

Notable create flags: `--dry-run`, `--verbose`, `--package-manager bun|npm|pnpm`, `--directory-conflict`, `--open <bin>`, `--manual-db`.

## Publish (maintainers)

From the repo root:

```sh
bun install
bun run --filter=create-effect-t-stack pack:golden
cd apps/cli && bun pm pack   # inspect tarball
npm publish --access public  # requires npm auth; bumps version first
```

`prepack` embeds `examples/golden` into `templates/golden` (denylist applied). Do not commit `templates/golden`.

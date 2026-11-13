# `@ets/effect-oxc`

Owned copy of the unpublished [`@effect/oxc`](https://github.com/Effect-TS/effect/tree/7865dbbb7b6a91691921dbb4febedf3ab94a348b/packages/tools/oxc) plugin so effect-style lint does not load `repos/effect`.

## Origin

Copied from Effect-TS/effect `packages/tools/oxc/src/oxlint` at commit [`7865dbbb7b6a91691921dbb4febedf3ab94a348b`](https://github.com/Effect-TS/effect/commit/7865dbbb7b6a91691921dbb4febedf3ab94a348b). That commit is the subtree snapshot in this repo (`repos/effect`, squash `2f2c425ef1834643d778e688fdf0a859d14ec8b6`).

Files:

- `src/oxlint/index.ts`
- `src/oxlint/rules/no-bigint-literals.ts`
- `src/oxlint/rules/no-import-from-barrel-package.ts`
- `src/oxlint/rules/no-js-extension-imports.ts`
- `src/oxlint/rules/no-opaque-instance-fields.ts`
- `src/oxlint/rules/no-unused-internal.ts`

The same sources are copied into `packages/template-generator/templates/addons/effect-style/packages/effect-oxc` so a generated app lints without `repos/`. A generator test checks the two trees match.

## When Effect publishes `@effect/oxc`

1. Depend on the npm package instead of this workspace package.
2. Point oxlint `jsPlugins` at the published export (`@effect/oxc/oxlint`).
3. Delete `packages/effect-oxc` and the template copy.

# Templates are the source of truth; the Golden Sample is deleted

`packages/template-generator` is the only product source of truth for apps created by `create-effect-t-stack`. The runnable monorepo that used to live at `examples/golden` was extracted into those templates and then deleted. `create` calls `generate` and `writeTree`. It does not copy a sample tree.

Maintainers change a generated app by editing a Handlebars fragment or a post-processor, then proving it with a generated-build (install, typecheck, and lint). Do not recreate a second default monorepo. Dependency pins live only in `dependencyVersionMap`.

The default stack is unchanged: Rpc primary, HttpApi secondary, Bun, SQLite + Drizzle, auth none, TanStack Start, effect-style on, todo included. Option Matrix cells beyond that default (API primary flip, other databases, Node, auth, and the rest) are backlog. They are authored in templates after this exit, not by restoring a golden sample.

## Considered options

- Keep `examples/golden` forever and layer `.hbs` overlays on a copy — rejected: two sources of truth drift, and the maintenance model we chose is Better-T-Stack’s (templates only).
- Delete the sample before `--yes` was proven on the generator path — rejected: the generated-build is the proof that the templates are the product.

## Consequences

- `bun run check` is the scaffold CLI, the template generator, and `packages/effect-oxc`. It does not install or test a sample app.
- CI still runs the gated generated-build (`ETS_GENERATED_BUILD=1`): install, `check-types`, and lint, with no `repos/` tree.
- Docs that said “edit golden first” are historical. L0–L2 records may still say Golden Sample; that names the deleted sample, not a live path.

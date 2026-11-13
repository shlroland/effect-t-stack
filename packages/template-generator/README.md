# `@effect-t-stack/template-generator`

In-memory generator for `create-effect-t-stack`. These templates are the only product source of truth. The default stack is Rpc primary, HttpApi secondary, Bun, SQLite + Drizzle, auth none, TanStack Start, effect-style on, todo. `create` calls `generate` + `writeTree`.

```ts
import { EMBEDDED_TEMPLATES, generate, projectConfig } from "@effect-t-stack/template-generator"
import { writeTree } from "@effect-t-stack/template-generator/fs-writer"

const result = generate({
  config: projectConfig("my-app"),
  templates: EMBEDDED_TEMPLATES,
  version: "0.1.0"
})
if (result._tag === "Success") await writeTree(result.value, "my-app")
```

- Templates are Handlebars fragments under `templates/`. Scope is `@{{projectName}}/…`.
- `generate` renders into a memfs VFS, then runs post-processors. It does not touch the disk.
- `writeTree` (Node-only entry `./fs-writer`) materializes the tree. Binary files use the `[Binary file]` marker plus `templates-binary/`.
- `bun run prebuild` embeds `templates/` as `EMBEDDED_TEMPLATES`. Create does not read the template directory at runtime.
- Versions live only in `dependencyVersionMap`. A catalog pass rewrites duplicates to Bun `catalog:` (npm skips).
- `ets.jsonc` is written in code when `version` is passed, not from a template.

`repos/` is not copied (same denylist as the CLI). `turbo.json`, README, and `.env` are generated from config. The todo slice lives on the default package and app prefixes.

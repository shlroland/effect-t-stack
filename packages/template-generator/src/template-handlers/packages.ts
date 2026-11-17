import * as Effect from "effect/Effect"

import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

const SPINE = ["domain", "protocol", "db", "client", "config"] as const

/** Effect Core spine. `packages/db` is omitted when there is no database/ORM (not the default cell). */
export const processPackageTemplates = Effect.fnUntraced(function*(
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) {
  for (const name of SPINE) {
    if (name === "db" && (config.database === "none" || config.orm === "none")) continue
    yield* processTemplatesFromPrefix(templates, config, `packages/${name}`, `packages/${name}`)
  }
})

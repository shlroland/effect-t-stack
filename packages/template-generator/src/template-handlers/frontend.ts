import * as Effect from "effect/Effect"

import { hasFrontend } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

export const processFrontendTemplates = Effect.fnUntraced(function*(
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) {
  if (!hasFrontend(config, "tanstack-start")) return
  yield* processTemplatesFromPrefix(templates, config, "frontend/tanstack-start", "apps/web")
})

import * as Effect from "effect/Effect"

import type { ProjectConfig } from "../types.ts"
import { processAddonTemplates } from "./addons.ts"
import { processBackendTemplates } from "./backend.ts"
import { processBaseTemplates } from "./base.ts"
import { processFrontendTemplates } from "./frontend.ts"
import { processPackageTemplates } from "./packages.ts"

/**
 * Handler order is the overlay order: later writes win.
 * The todo slice lives on these default prefixes (domain, protocol, db, server, web).
 * It is not a separate `templates/examples/todo` overlay yet; `examples: ["todo"]` selects this cell.
 */
export const applyTemplateHandlers = Effect.fnUntraced(function*(
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) {
  yield* processBaseTemplates(templates, config)
  yield* processPackageTemplates(templates, config)
  yield* processBackendTemplates(templates, config)
  yield* processFrontendTemplates(templates, config)
  yield* processAddonTemplates(templates, config)
})

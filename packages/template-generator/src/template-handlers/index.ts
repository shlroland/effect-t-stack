import * as Effect from "effect/Effect"

import { isLibraryTemplate } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"
import { processAddonTemplates } from "./addons.ts"
import { processAuthTemplates } from "./auth.ts"
import { processBackendTemplates } from "./backend.ts"
import { processBaseTemplates } from "./base.ts"
import { processFrontendTemplates } from "./frontend.ts"
import { processLibraryTemplates } from "./library.ts"
import { processPackageTemplates } from "./packages.ts"

/**
 * Handler order is the overlay order: later writes win.
 * The todo slice lives on these default prefixes (domain, protocol, db, server, web).
 * It is not a separate `templates/examples/todo` overlay yet; `examples: ["todo"]` selects this cell.
 * `--template library` uses `templates/library` + addons only (no apps/packages spine).
 */
export const applyTemplateHandlers = Effect.fnUntraced(function*(
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) {
  if (isLibraryTemplate(config)) {
    yield* processLibraryTemplates(templates, config)
    yield* processAddonTemplates(templates, config)
    return
  }
  yield* processBaseTemplates(templates, config)
  yield* processPackageTemplates(templates, config)
  yield* processBackendTemplates(templates, config)
  yield* processFrontendTemplates(templates, config)
  yield* processAuthTemplates(templates, config)
  yield* processAddonTemplates(templates, config)
})

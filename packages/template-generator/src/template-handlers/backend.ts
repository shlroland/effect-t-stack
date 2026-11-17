import * as Effect from "effect/Effect"

import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

/**
 * `backend=self` still emits `apps/server`. Services, Rpc, and HttpApi handlers live there;
 * TanStack Start mounts them. This is the Effect Core layout, not a BTS "self writes nothing" backend.
 */
export const processBackendTemplates = Effect.fnUntraced(function*(
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) {
  if (config.backend !== "self" && config.backend !== "server") return
  yield* processTemplatesFromPrefix(templates, config, "backend/server", "apps/server")
})

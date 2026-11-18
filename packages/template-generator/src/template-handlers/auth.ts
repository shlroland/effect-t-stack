import * as Effect from "effect/Effect"

import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

const OVERLAYS = [
  ["auth/better-auth/packages/auth", "packages/auth"],
  ["auth/better-auth/packages/domain", "packages/domain"],
  ["auth/better-auth/packages/protocol", "packages/protocol"],
  ["auth/better-auth/packages/db", "packages/db"],
  ["auth/better-auth/packages/config", "packages/config"],
  ["auth/better-auth/backend/server", "apps/server"],
  ["auth/better-auth/frontend/tanstack-start", "apps/web"]
] as const

/** Better Auth cell overlays (ADR-0008). Runs after frontend so `server.ts` and routes win. */
export const processAuthTemplates = Effect.fnUntraced(function*(
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) {
  if (config.auth !== "better-auth") return
  for (const [prefix, dest] of OVERLAYS) {
    yield* processTemplatesFromPrefix(templates, config, prefix, dest)
  }
})

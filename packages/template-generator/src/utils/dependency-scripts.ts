import { hasAddon } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"

/**
 * Lifecycle packages npm `allowScripts` / pnpm `allowBuilds` must permit.
 * Grow this list as Option Matrix addons that ship native install scripts land.
 */
export const getAllowedDependencyScripts = (config: ProjectConfig): ReadonlyArray<string> => {
  const allowed: Array<string> = []
  if (config.orm === "drizzle" || config.orm === "prisma") {
    allowed.push("esbuild")
  }
  if (hasAddon(config, "effect-style")) {
    allowed.push("dprint", "lefthook")
  }
  return allowed
}

import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Absolute path to the Golden Sample tree.
 *
 * Resolution order:
 * 1. `ETS_GOLDEN_ROOT` (tests / overrides)
 * 2. `examples/golden` (Scaffold Product monorepo — source of truth)
 * 3. `apps/cli/templates/golden` (npm-packed / published tarball)
 */
export const resolveGoldenRoot = (fromModuleUrl: string = import.meta.url): string => {
  const envRoot = process.env["ETS_GOLDEN_ROOT"]
  if (envRoot !== undefined && envRoot.length > 0) {
    return envRoot
  }

  const here = dirname(fileURLToPath(fromModuleUrl))
  const monorepo = join(here, "../../../../examples/golden")
  if (existsSync(join(monorepo, "package.json"))) {
    return monorepo
  }

  const packed = join(here, "../../templates/golden")
  if (existsSync(join(packed, "package.json"))) {
    return packed
  }

  return monorepo
}

export const resolveRepoRoot = (fromModuleUrl: string = import.meta.url): string => {
  const here = dirname(fileURLToPath(fromModuleUrl))
  return join(here, "../../../..")
}

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Absolute path to examples/golden inside the Scaffold Product repo. */
export const resolveGoldenRoot = (fromModuleUrl: string = import.meta.url): string => {
  const here = dirname(fileURLToPath(fromModuleUrl))
  // apps/cli/src → repo root → examples/golden
  return join(here, "../../../examples/golden")
}

export const resolveRepoRoot = (fromModuleUrl: string = import.meta.url): string => {
  const here = dirname(fileURLToPath(fromModuleUrl))
  return join(here, "../../..")
}

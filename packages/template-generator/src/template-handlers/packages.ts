import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

const SPINE = ["domain", "protocol", "db", "client", "config"] as const

/** Effect Core spine. `packages/db` is omitted when there is no database/ORM (not the default cell). */
export const processPackageTemplates = (
  vfs: VirtualFileSystem,
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
): void => {
  for (const name of SPINE) {
    if (name === "db" && (config.database === "none" || config.orm === "none")) continue
    processTemplatesFromPrefix(vfs, templates, config, `packages/${name}`, `packages/${name}`)
  }
}

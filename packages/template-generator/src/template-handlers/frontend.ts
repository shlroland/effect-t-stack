import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import { hasFrontend } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

export const processFrontendTemplates = (
  vfs: VirtualFileSystem,
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
): void => {
  if (!hasFrontend(config, "tanstack-start")) return
  processTemplatesFromPrefix(vfs, templates, config, "frontend/tanstack-start", "apps/web")
}

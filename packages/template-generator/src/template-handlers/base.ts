import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

export const processBaseTemplates = (
  vfs: VirtualFileSystem,
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
): void => {
  processTemplatesFromPrefix(vfs, templates, config, "base", "")
}

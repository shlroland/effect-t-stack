import type { VirtualFileSystem } from "../core/virtual-fs.ts"
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
export const applyTemplateHandlers = (
  vfs: VirtualFileSystem,
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
): void => {
  processBaseTemplates(vfs, templates, config)
  processPackageTemplates(vfs, templates, config)
  processBackendTemplates(vfs, templates, config)
  processFrontendTemplates(vfs, templates, config)
  processAddonTemplates(vfs, templates, config)
}

import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import { hasAddon } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

/**
 * `turborepo` is a code generator (`turbo.json`), not a template prefix.
 * `repos`, `language-service`, and `mcp` are fingerprint + dependency concerns for this cell
 * (the vendored `repos/` tree is not copied; same denylist as the CLI copy path).
 */
export const processAddonTemplates = (
  vfs: VirtualFileSystem,
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
): void => {
  if (hasAddon(config, "effect-style")) {
    processTemplatesFromPrefix(vfs, templates, config, "addons/effect-style", "")
  }
  if (hasAddon(config, "skills")) {
    processTemplatesFromPrefix(vfs, templates, config, "addons/skills", "")
  }
}

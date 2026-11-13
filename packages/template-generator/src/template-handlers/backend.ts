import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

/**
 * `backend=self` still emits `apps/server`. Services, Rpc, and HttpApi handlers live there;
 * TanStack Start mounts them. This is the Effect Core layout, not a BTS "self writes nothing" backend.
 */
export const processBackendTemplates = (
  vfs: VirtualFileSystem,
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
): void => {
  if (config.backend !== "self" && config.backend !== "server") return
  processTemplatesFromPrefix(vfs, templates, config, "backend/server", "apps/server")
}

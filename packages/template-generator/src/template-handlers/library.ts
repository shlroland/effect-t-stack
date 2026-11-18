import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

/** Single-package Effect library preset (`--template library`). */
export const processLibraryTemplates = (
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) => processTemplatesFromPrefix(templates, config, "library", "")

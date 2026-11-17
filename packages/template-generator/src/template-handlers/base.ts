import type { ProjectConfig } from "../types.ts"
import { processTemplatesFromPrefix } from "./utils.ts"

export const processBaseTemplates = (
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig
) => processTemplatesFromPrefix(templates, config, "base", "")

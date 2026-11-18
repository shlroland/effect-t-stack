export { GenerateLayers } from "./core/layers.ts"
export { BINARY_MARKER, makeTemplateEngine, TemplateEngine } from "./core/template-engine.ts"
export type { TemplateEngineService } from "./core/template-engine.ts"
export { loadTemplates, readTemplateEntries, resolveTemplatesRoot, TemplateReader } from "./core/template-reader.ts"
export type { TemplateEntry, TemplateReaderService } from "./core/template-reader.ts"
export { createVirtualFileSystem, makeMemVirtualFs, seedTextFiles, VirtualFs } from "./core/virtual-fs.ts"
export type { VirtualFsService } from "./core/virtual-fs.ts"
export {
  DEFAULT_ADDONS,
  isLibraryTemplate,
  LIBRARY_ADDONS,
  libraryProjectConfig,
  projectConfig
} from "./default-config.ts"
export { ETS_SCHEMA_URL, FINGERPRINT_SCHEMA_VERSION, writeEtsConfig } from "./ets-config.ts"
export { generate } from "./generator.ts"
export { EMBEDDED_TEMPLATES, TEMPLATE_COUNT } from "./templates.generated.ts"
export { GeneratorError, GeneratorPhase } from "./types.ts"
export type {
  GenerateOptions,
  GeneratorPhase as GeneratorPhaseType,
  ProjectConfig,
  VirtualDirNode,
  VirtualFileNode,
  VirtualFileTree,
  VirtualNode
} from "./types.ts"
export { addPackageDependency } from "./utils/add-deps.ts"
export { dependencyVersionMap } from "./utils/dependency-versions.ts"

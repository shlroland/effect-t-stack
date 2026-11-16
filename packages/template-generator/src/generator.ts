import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { countTree, createVirtualFileSystem } from "./core/virtual-fs.ts"
import { unsupportedStackMessage } from "./default-config.ts"
import { writeEtsConfig } from "./ets-config.ts"
import { processCatalogs } from "./post-process/catalogs.ts"
import { processPackageConfigs } from "./post-process/package-configs.ts"
import { processDependencies } from "./processors/dependencies.ts"
import { processEnvVariables } from "./processors/env-vars.ts"
import { processReadme } from "./processors/readme-generator.ts"
import { applyTemplateHandlers } from "./template-handlers/index.ts"
import { type GenerateOptions, GeneratorError, type VirtualFileTree } from "./types.ts"

const mapCause = (cause: unknown): GeneratorError => {
  if (cause instanceof GeneratorError) {
    return cause
  }
  const message = cause instanceof Error ? cause.message : String(cause)
  return new GeneratorError({ phase: "initialization", message, cause })
}

/**
 * Authoritative generate order. Do not route this through a smaller post-process helper.
 * 1. Template handlers write fragments (later writes win).
 * 2. Package names and root scripts.
 * 3. Dependencies from `dependencyVersionMap`, then `turbo.json`.
 * 4. `.env` files.
 * 5. Catalog hoist (`catalog:` / npm skip).
 * 6. README.
 * 7. `ets.jsonc` only when `version` (CLI release) is passed.
 */
export const generate = Effect.fn("generate")(function*(options: GenerateOptions) {
  if (options.templates.size === 0) {
    return yield* new GeneratorError({
      phase: "initialization",
      message: "Template map is empty"
    })
  }
  const unsupported = unsupportedStackMessage(options.config)
  if (Option.isSome(unsupported)) {
    return yield* new GeneratorError({ phase: "initialization", message: unsupported.value })
  }

  return yield* Effect.try({
    try: (): VirtualFileTree => {
      const vfs = createVirtualFileSystem()
      applyTemplateHandlers(vfs, options.templates, options.config)
      processPackageConfigs(vfs, options.config)
      processDependencies(vfs, options.config)
      processEnvVariables(vfs, options.config)
      processCatalogs(vfs, options.config)
      processReadme(vfs, options.config)
      if (options.version !== undefined) writeEtsConfig(vfs, options.config, options.version)
      const root = vfs.toTree(options.config.projectName)
      const counts = countTree(root)
      return {
        root,
        fileCount: counts.fileCount,
        directoryCount: counts.directoryCount,
        config: options.config
      }
    },
    catch: mapCause
  })
})

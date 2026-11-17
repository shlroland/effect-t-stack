import * as Effect from "effect/Effect"

import { TemplateEngine } from "../core/template-engine.ts"
import { VirtualFs } from "../core/virtual-fs.ts"
import { GeneratorError, type ProjectConfig } from "../types.ts"

/**
 * Copy one template prefix onto a destination prefix.
 * The prefix directory is stripped. `.hbs` is compiled and removed. Later writes replace earlier ones.
 */
export const processTemplatesFromPrefix = Effect.fnUntraced(function*(
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig,
  prefix: string,
  destPrefix: string
) {
  const vfs = yield* VirtualFs
  const engine = yield* TemplateEngine
  const needle = `${prefix}/`
  const keys = [...templates.keys()].filter((key) => key.startsWith(needle)).sort((a, b) => a.localeCompare(b))
  for (const key of keys) {
    const raw = templates.get(key)
    if (raw === undefined) continue
    const relative = engine.transformTemplatePath(key.slice(needle.length))
    const destination = destPrefix.length === 0 ? relative : `${destPrefix}/${relative}`
    if (engine.isBinaryTemplatePath(key)) {
      vfs.writeFile(destination, engine.binaryMarker, key)
      continue
    }
    let content = raw
    if (key.endsWith(".hbs")) {
      content = yield* Effect.try({
        try: () => engine.compile(raw, config),
        catch: (cause) => {
          const message = cause instanceof Error ? cause.message : String(cause)
          return new GeneratorError({
            phase: "templates",
            message: `Failed to render ${key}: ${message}`,
            cause
          })
        }
      })
    }
    vfs.writeFile(destination, content)
  }
})

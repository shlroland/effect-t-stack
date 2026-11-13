import { BINARY_MARKER, isBinaryTemplatePath } from "../core/binary.ts"
import { compileTemplate, transformTemplatePath } from "../core/template-processor.ts"
import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import { GeneratorError, type ProjectConfig } from "../types.ts"

/**
 * Copy one template prefix onto a destination prefix.
 * The prefix directory is stripped. `.hbs` is compiled and removed. Later writes replace earlier ones.
 */
export const processTemplatesFromPrefix = (
  vfs: VirtualFileSystem,
  templates: ReadonlyMap<string, string>,
  config: ProjectConfig,
  prefix: string,
  destPrefix: string
): void => {
  const needle = `${prefix}/`
  const keys = [...templates.keys()].filter((key) => key.startsWith(needle)).sort((a, b) => a.localeCompare(b))
  for (const key of keys) {
    const raw = templates.get(key)
    if (raw === undefined) continue
    const relative = transformTemplatePath(key.slice(needle.length))
    const destination = destPrefix.length === 0 ? relative : `${destPrefix}/${relative}`
    if (isBinaryTemplatePath(key)) {
      vfs.writeFile(destination, BINARY_MARKER, key)
      continue
    }
    let content = raw
    if (key.endsWith(".hbs")) {
      try {
        content = compileTemplate(raw, config)
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)
        throw new GeneratorError("templates", `Failed to render ${key}: ${message}`, { cause })
      }
    }
    vfs.writeFile(destination, content)
  }
}

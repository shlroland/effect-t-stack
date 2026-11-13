import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { BINARY_MARKER, isBinaryTemplatePath } from "./binary.ts"

export type TemplateEntry = {
  readonly path: string
  readonly content: string
  readonly binary: boolean
}

const skipDirectory = (name: string): boolean => name === "node_modules" || name === ".git"

/**
 * Dev-time disk read of `templates/`. Create uses `EMBEDDED_TEMPLATES` and does not call this.
 * Search paths cover src, a future dist layout, and the package root.
 */
export const resolveTemplatesRoot = (moduleUrl: string = import.meta.url): string => {
  const here = dirname(fileURLToPath(moduleUrl))
  const candidates = [
    resolve(here, "../../templates"),
    resolve(here, "../templates"),
    resolve(here, "../../../templates")
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isDirectory()) return candidate
  }
  throw new Error(`templates directory not found from ${here}`)
}

export const readTemplateEntries = (root: string = resolveTemplatesRoot()): ReadonlyArray<TemplateEntry> => {
  const entries: Array<TemplateEntry> = []
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      if (skipDirectory(name)) continue
      const absolute = resolve(directory, name)
      const stat = statSync(absolute)
      if (stat.isDirectory()) {
        visit(absolute)
        continue
      }
      if (!stat.isFile()) continue
      const path = absolute.slice(root.length + 1).split("\\").join("/")
      const binary = isBinaryTemplatePath(path)
      entries.push({
        path,
        binary,
        content: binary ? BINARY_MARKER : readFileSync(absolute, "utf8")
      })
    }
  }
  visit(root)
  entries.sort((a, b) => a.path.localeCompare(b.path))
  return entries
}

export const loadTemplates = (root?: string): Map<string, string> => {
  const templates = new Map<string, string>()
  for (const entry of readTemplateEntries(root)) templates.set(entry.path, entry.content)
  return templates
}

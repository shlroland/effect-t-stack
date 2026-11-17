import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { BINARY_MARKER, TemplateEngine } from "./template-engine.ts"

export type TemplateEntry = {
  readonly path: string
  readonly content: string
  readonly binary: boolean
}

const skipDirectory = (name: string): boolean => name === "node_modules" || name === ".git"

const resolveTemplatesRootFrom = (moduleUrl: string): string => {
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

/**
 * Dev-time disk read of `templates/`. Create uses `EMBEDDED_TEMPLATES` and does not call this.
 * Requires `TemplateEngine` for binary detection / marker.
 */
export class TemplateReader extends Context.Service<TemplateReader, {
  readonly resolveTemplatesRoot: (moduleUrl?: string) => string
  readonly readTemplateEntries: (root?: string) => ReadonlyArray<TemplateEntry>
  readonly loadTemplates: (root?: string) => Map<string, string>
}>()("@effect-t-stack/template-generator/core/TemplateReader") {
  static readonly layer: Layer.Layer<TemplateReader, never, TemplateEngine> = Layer.effect(TemplateReader)(
    Effect.gen(function*() {
      const engine = yield* TemplateEngine
      return makeTemplateReader(engine)
    })
  )

  /** Self-contained layer for scripts/tests (includes `TemplateEngine`). */
  static readonly layerLive: Layer.Layer<TemplateReader | TemplateEngine> = TemplateReader.layer.pipe(
    Layer.provideMerge(TemplateEngine.layer)
  )
}

export type TemplateReaderService = TemplateReader["Service"]

export const makeTemplateReader = (engine: TemplateEngine["Service"]): TemplateReaderService => {
  const readTemplateEntries = (
    root: string = resolveTemplatesRootFrom(import.meta.url)
  ): ReadonlyArray<TemplateEntry> => {
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
        const binary = engine.isBinaryTemplatePath(path)
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

  const loadTemplates = (root?: string): Map<string, string> => {
    const templates = new Map<string, string>()
    for (const entry of readTemplateEntries(root)) templates.set(entry.path, entry.content)
    return templates
  }

  return TemplateReader.of({
    resolveTemplatesRoot: (moduleUrl = import.meta.url) => resolveTemplatesRootFrom(moduleUrl),
    readTemplateEntries,
    loadTemplates
  })
}

/** Run against `TemplateReader.layerLive` (scripts / contract tests). */
export const loadTemplates = (root?: string): Map<string, string> =>
  Effect.runSync(
    Effect.gen(function*() {
      const reader = yield* TemplateReader
      return reader.loadTemplates(root)
    }).pipe(Effect.provide(TemplateReader.layerLive))
  )

export const readTemplateEntries = (root?: string): ReadonlyArray<TemplateEntry> =>
  Effect.runSync(
    Effect.gen(function*() {
      const reader = yield* TemplateReader
      return reader.readTemplateEntries(root)
    }).pipe(Effect.provide(TemplateReader.layerLive))
  )

export const resolveTemplatesRoot = (moduleUrl?: string): string =>
  Effect.runSync(
    Effect.gen(function*() {
      const reader = yield* TemplateReader
      return reader.resolveTemplatesRoot(moduleUrl)
    }).pipe(Effect.provide(TemplateReader.layerLive))
  )

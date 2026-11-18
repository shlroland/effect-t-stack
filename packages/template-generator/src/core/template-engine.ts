import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import Handlebars from "handlebars"

import type { ProjectConfig } from "../types.ts"
import { getPackageManagerConfig } from "../utils/package-manager.ts"
import { basenamePosix } from "./paths.ts"

/** Marker stored in the template map and VFS for files `writeTree` copies as bytes. */
export const BINARY_MARKER = "[Binary file]"

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".ico",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".pdf",
  ".wasm"
])

const DOTFILES: Readonly<Record<string, string>> = {
  _gitignore: ".gitignore",
  _npmrc: ".npmrc",
  _dockerignore: ".dockerignore",
  _vercelignore: ".vercelignore"
}

const dropOptions = (args: ReadonlyArray<unknown>): ReadonlyArray<unknown> => args.slice(0, -1)

const isBinaryTemplatePath = (filePath: string): boolean => {
  const lower = filePath.toLowerCase()
  const dot = lower.lastIndexOf(".")
  if (dot === -1) return false
  return BINARY_EXTENSIONS.has(lower.slice(dot))
}

const transformTemplatePath = (relativePath: string): string => {
  const stripped = relativePath.endsWith(".hbs") ? relativePath.slice(0, -".hbs".length) : relativePath
  const parts = stripped.split("/")
  const last = parts[parts.length - 1]
  if (last === undefined) return stripped
  parts[parts.length - 1] = DOTFILES[last] ?? last
  return parts.join("/")
}

/**
 * Handlebars compile + template path transforms + binary detection.
 * One Handlebars instance per layer build (helpers registered once).
 */
export class TemplateEngine extends Context.Service<TemplateEngine, {
  readonly binaryMarker: string
  readonly isBinaryTemplatePath: (filePath: string) => boolean
  readonly compile: (source: string, config: ProjectConfig) => string
  readonly transformTemplatePath: (relativePath: string) => string
  readonly transformFilename: (name: string) => string
}>()("@effect-t-stack/template-generator/core/TemplateEngine") {
  static readonly layer: Layer.Layer<TemplateEngine> = Layer.sync(TemplateEngine)(() => makeTemplateEngine())
}

export type TemplateEngineService = TemplateEngine["Service"]

export const makeTemplateEngine = (): TemplateEngineService => {
  const handlebars = Handlebars.create()
  handlebars.registerHelper("eq", (left: unknown, right: unknown) => left === right)
  handlebars.registerHelper("ne", (left: unknown, right: unknown) => left !== right)
  handlebars.registerHelper("and", (...args: Array<unknown>) => dropOptions(args).every(Boolean))
  handlebars.registerHelper("or", (...args: Array<unknown>) => dropOptions(args).some(Boolean))
  handlebars.registerHelper("not", (value: unknown) => !value)
  handlebars.registerHelper("includes", (collection: unknown, value: unknown) => {
    if (Array.isArray(collection)) return collection.includes(value)
    if (typeof collection === "string") return collection.includes(String(value))
    return false
  })

  return TemplateEngine.of({
    binaryMarker: BINARY_MARKER,
    isBinaryTemplatePath,
    compile: (source, config) => {
      const pm = getPackageManagerConfig(config.packageManager)
      return handlebars.compile(source, { noEscape: true })({
        ...config,
        pm: {
          name: pm.name,
          exec: pm.exec,
          dlx: pm.dlx,
          install: pm.install
        }
      })
    },
    transformTemplatePath,
    transformFilename: (name) => transformTemplatePath(basenamePosix(name))
  })
}

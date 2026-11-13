import Handlebars from "handlebars"

import type { ProjectConfig } from "../types.ts"
import { basenamePosix } from "./paths.ts"

const handlebars = Handlebars.create()

const dropOptions = (args: ReadonlyArray<unknown>): ReadonlyArray<unknown> => args.slice(0, -1)

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

/** Compile a `.hbs` source. `noEscape` so generated TS/JSON is not HTML-escaped. Context is the project config. */
export const compileTemplate = (source: string, config: ProjectConfig): string =>
  handlebars.compile(source, { noEscape: true })(config)

const DOTFILES: Readonly<Record<string, string>> = {
  _gitignore: ".gitignore",
  _npmrc: ".npmrc",
  _dockerignore: ".dockerignore",
  _vercelignore: ".vercelignore"
}

/** Strip `.hbs` and map `_gitignore`-style names to dotfiles. */
export const transformTemplatePath = (relativePath: string): string => {
  const stripped = relativePath.endsWith(".hbs") ? relativePath.slice(0, -".hbs".length) : relativePath
  const parts = stripped.split("/")
  const last = parts[parts.length - 1]
  if (last === undefined) return stripped
  parts[parts.length - 1] = DOTFILES[last] ?? last
  return parts.join("/")
}

export const transformFilename = (name: string): string => transformTemplatePath(basenamePosix(name))

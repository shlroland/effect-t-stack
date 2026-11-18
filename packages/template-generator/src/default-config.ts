import * as Array from "effect/Array"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import type { FrontendId, ProjectConfig, TemplateId } from "./types.ts"

/** Golden Sample / `--yes` addons, in fingerprint order. */
export const DEFAULT_ADDONS = [
  "turborepo",
  "skills",
  "repos",
  "language-service",
  "mcp",
  "effect-style",
  "flake"
] as const

/**
 * Library preset addons: effect-style + agent DX, no turborepo/repos.
 * `packages/effect-oxc` still lands via the effect-style overlay.
 */
export const LIBRARY_ADDONS = [
  "skills",
  "language-service",
  "mcp",
  "effect-style",
  "flake"
] as const

export const hasAddon = (config: ProjectConfig, addon: string): boolean => config.addons.includes(addon)

export const hasFrontend = (config: ProjectConfig, frontend: FrontendId): boolean => config.frontend.includes(frontend)

export const isLibraryTemplate = (config: ProjectConfig): boolean => config.template === "library"

/**
 * Default stack: Rpc primary, HttpApi secondary, Bun, SQLite + Drizzle, auth none,
 * TanStack Start, effect-style on, todo included.
 * `projectName` is the npm scope segment (`@<projectName>/…`), not a display title.
 */
export const projectConfig = (
  projectName: string,
  patch?: Partial<Omit<ProjectConfig, "projectName">>
): ProjectConfig => ({
  projectName,
  template: "default",
  runtime: "bun",
  api: "rpc",
  database: "sqlite",
  orm: "drizzle",
  auth: "none",
  frontend: ["tanstack-start"],
  backend: "self",
  packageManager: "bun",
  dbSetup: "none",
  webDeploy: "none",
  serverDeploy: "none",
  addons: [...DEFAULT_ADDONS],
  examples: ["todo"],
  ...patch
})

/** Publishable single-package Effect library (`--template library`). */
export const libraryProjectConfig = (
  projectName: string,
  patch?: Partial<Omit<ProjectConfig, "projectName" | "template">>
): ProjectConfig =>
  projectConfig(projectName, {
    template: "library",
    api: "none",
    database: "none",
    orm: "none",
    auth: "none",
    frontend: ["none"],
    backend: "none",
    examples: [],
    addons: [...LIBRARY_ADDONS],
    ...patch
  })

const sameMembers = (actual: ReadonlyArray<string>, expected: ReadonlyArray<string>): boolean => {
  if (actual.length !== expected.length) return false
  const present = new Set(actual)
  return expected.every((item) => present.has(item))
}

/** `None` = ok; `Some(label)` = unsupported dimension for the current template cell. */
type StackCheck = (config: ProjectConfig) => Option.Option<string>

const requireEq = <K extends keyof ProjectConfig>(
  key: K,
  expected: ProjectConfig[K]
): StackCheck =>
(config) => config[key] === expected ? Option.none() : Option.some(`${String(key)}=${String(config[key])}`)

const requireOneOf = <K extends keyof ProjectConfig>(
  key: K,
  allowed: ReadonlyArray<ProjectConfig[K]>
): StackCheck =>
(config) =>
  allowed.includes(config[key])
    ? Option.none()
    : Option.some(`${String(key)}=${String(config[key])}`)

const requireMembers = (
  key: "frontend" | "addons" | "examples",
  expected: ReadonlyArray<string>
): StackCheck =>
(config) =>
  sameMembers(config[key], expected)
    ? Option.none()
    : Option.some(`${key}=${config[key].join(",")}`)

const requireProjectName: StackCheck = (config) =>
  /^[a-z0-9][a-z0-9._-]*$/.test(config.projectName)
    ? Option.none()
    : Option.some(`projectName=${JSON.stringify(config.projectName)}`)

const requireKnownPackageManager: StackCheck = (config) =>
  config.packageManager === "bun" ||
    config.packageManager === "npm" ||
    config.packageManager === "pnpm"
    ? Option.none()
    : Option.some(`packageManager=${config.packageManager}`)

const DEFAULT_STACK_CHECKS: ReadonlyArray<StackCheck> = [
  requireProjectName,
  requireEq("template", "default" satisfies TemplateId),
  requireEq("runtime", "bun"),
  requireOneOf("api", ["rpc", "httpapi"]),
  requireOneOf("database", ["sqlite", "postgres"]),
  requireEq("orm", "drizzle"),
  requireOneOf("auth", ["none", "better-auth"]),
  requireEq("backend", "self"),
  requireEq("dbSetup", "none"),
  requireEq("webDeploy", "none"),
  requireEq("serverDeploy", "none"),
  requireKnownPackageManager,
  requireMembers("frontend", ["tanstack-start"]),
  requireMembers("addons", DEFAULT_ADDONS),
  requireMembers("examples", ["todo"])
]

const LIBRARY_STACK_CHECKS: ReadonlyArray<StackCheck> = [
  requireProjectName,
  requireEq("template", "library" satisfies TemplateId),
  requireEq("runtime", "bun"),
  requireEq("api", "none"),
  requireEq("database", "none"),
  requireEq("orm", "none"),
  requireEq("auth", "none"),
  requireEq("backend", "none"),
  requireEq("dbSetup", "none"),
  requireEq("webDeploy", "none"),
  requireEq("serverDeploy", "none"),
  requireKnownPackageManager,
  requireMembers("frontend", ["none"]),
  requireMembers("addons", LIBRARY_ADDONS),
  requireMembers("examples", [])
]

const defaultPreamble = "This generator currently emits the Golden default cell family only " +
  "(api ∈ {rpc, httpapi}, database ∈ {sqlite, postgres}, Bun, Drizzle, auth ∈ {none, better-auth}, " +
  "TanStack Start, effect-style on, todo). Unsupported: "

const libraryPreamble = "Library preset requires Bun, api/database/orm/auth/frontend/backend=none, " +
  "addons={skills,language-service,mcp,effect-style,flake}, no examples. Unsupported: "

/**
 * Supported cells: Golden default family, or `--template library`.
 * Other Option Matrix cells are refused instead of emitting a partial tree.
 */
export const unsupportedStackMessage = (config: ProjectConfig): Option.Option<string> => {
  const checks = isLibraryTemplate(config) ? LIBRARY_STACK_CHECKS : DEFAULT_STACK_CHECKS
  const preamble = isLibraryTemplate(config) ? libraryPreamble : defaultPreamble
  return pipe(
    checks,
    Array.map((check) => check(config)),
    Array.getSomes,
    Option.liftPredicate(Array.isArrayNonEmpty),
    Option.map((problems) => `${preamble}${Array.join(problems, "; ")}`)
  )
}

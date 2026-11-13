import type { FrontendId, ProjectConfig } from "./types.ts"

/** Golden Sample / `--yes` addons, in fingerprint order. */
export const DEFAULT_ADDONS = [
  "turborepo",
  "skills",
  "repos",
  "language-service",
  "mcp",
  "effect-style"
] as const

export const hasAddon = (config: ProjectConfig, addon: string): boolean => config.addons.includes(addon)

export const hasFrontend = (config: ProjectConfig, frontend: FrontendId): boolean => config.frontend.includes(frontend)

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

const sameMembers = (actual: ReadonlyArray<string>, expected: ReadonlyArray<string>): boolean => {
  if (actual.length !== expected.length) return false
  const present = new Set(actual)
  return expected.every((item) => present.has(item))
}

/**
 * The first template is the Golden default cell only. Other Option Matrix cells
 * are refused instead of emitting a partial tree.
 */
export const unsupportedStackMessage = (config: ProjectConfig): string | undefined => {
  const problems: Array<string> = []
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(config.projectName)) {
    problems.push(`projectName=${JSON.stringify(config.projectName)}`)
  }
  if (config.runtime !== "bun") problems.push(`runtime=${config.runtime}`)
  if (config.api !== "rpc") problems.push(`api=${config.api}`)
  if (config.database !== "sqlite") problems.push(`database=${config.database}`)
  if (config.orm !== "drizzle") problems.push(`orm=${config.orm}`)
  if (config.auth !== "none") problems.push(`auth=${config.auth}`)
  if (config.backend !== "self") problems.push(`backend=${config.backend}`)
  if (config.dbSetup !== "none") problems.push(`dbSetup=${config.dbSetup}`)
  if (config.webDeploy !== "none") problems.push(`webDeploy=${config.webDeploy}`)
  if (config.serverDeploy !== "none") problems.push(`serverDeploy=${config.serverDeploy}`)
  if (config.packageManager !== "bun" && config.packageManager !== "npm" && config.packageManager !== "pnpm") {
    problems.push(`packageManager=${config.packageManager}`)
  }
  if (!sameMembers(config.frontend, ["tanstack-start"])) {
    problems.push(`frontend=${config.frontend.join(",")}`)
  }
  if (!sameMembers(config.addons, DEFAULT_ADDONS)) {
    problems.push(`addons=${config.addons.join(",")}`)
  }
  if (!sameMembers(config.examples, ["todo"])) {
    problems.push(`examples=${config.examples.join(",")}`)
  }
  if (problems.length === 0) return undefined
  return "This generator currently emits the Golden default stack only " +
    "(Rpc primary, HttpApi secondary, Bun, SQLite, Drizzle, auth none, TanStack Start, " +
    `effect-style on, todo). Unsupported: ${problems.join("; ")}`
}

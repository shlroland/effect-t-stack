import type { VirtualFsService } from "../core/virtual-fs.ts"
import { hasAddon, isLibraryTemplate } from "../default-config.ts"
import { GeneratorError, type ProjectConfig } from "../types.ts"
import { packageJsonPath } from "../utils/add-deps.ts"
import { getAllowedDependencyScripts } from "../utils/dependency-scripts.ts"
import { getPackageManagerConfig } from "../utils/package-manager.ts"

type PackageJson = Record<string, unknown>

const WORKSPACE_PACKAGES = [
  ["packages/domain", "domain"],
  ["packages/protocol", "protocol"],
  ["packages/db", "db"],
  ["packages/client", "client"],
  ["packages/config", "config"],
  ["packages/auth", "auth"],
  ["packages/effect-oxc", "effect-oxc"],
  ["apps/server", "server"],
  ["apps/web", "web"]
] as const

/** Golden Sample pin. The CLI stamps the detected package-manager version after `writeTree`. */
const BUN_PACKAGE_MANAGER_PIN = "bun@1.4.4"

const readPackage = (vfs: VirtualFsService, path: string): PackageJson | undefined => {
  if (!vfs.fileExists(path)) return undefined
  try {
    const parsed: unknown = vfs.readJson(path)
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new GeneratorError({ phase: "package-configs", message: `${path} is not an object` })
    }
    return parsed as PackageJson
  } catch (cause) {
    if (cause instanceof GeneratorError) throw cause
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new GeneratorError({
      phase: "package-configs",
      message: `Invalid JSON in ${path}: ${message}`,
      cause
    })
  }
}

const turboRun = (config: ProjectConfig, script: string, pkg: string): string => {
  const filter = `@${config.projectName}/${pkg}`
  if (hasAddon(config, "turborepo")) return `turbo run ${script} --filter=${filter}`
  return getPackageManagerConfig(config.packageManager).filter(filter, script)
}

const lintPaths = (config: ProjectConfig): string => isLibraryTemplate(config) ? "src test packages" : "apps packages"

const rootScripts = (vfs: VirtualFsService, config: ProjectConfig): Record<string, string> => {
  const pm = getPackageManagerConfig(config.packageManager)
  const scripts: Record<string, string> = {}
  if (isLibraryTemplate(config)) {
    scripts["check-types"] = "tsc --noEmit -p tsconfig.json"
    scripts["test"] = "bun test"
  } else {
    if (vfs.fileExists("apps/web/package.json")) {
      scripts["dev"] = turboRun(config, "dev", "web")
      scripts["dev:web"] = turboRun(config, "dev", "web")
    }
    if (vfs.fileExists("apps/server/package.json")) {
      scripts["dev:server"] = turboRun(config, "dev", "server")
    }
    scripts["check-types"] = hasAddon(config, "turborepo")
      ? "turbo run check-types"
      : pm.recursive("check-types")
    scripts["test"] = hasAddon(config, "turborepo") ? "turbo run test" : pm.recursive("test")
  }
  if (hasAddon(config, "effect-style")) {
    const paths = lintPaths(config)
    scripts["lint"] = `oxlint -c .oxlintrc.json -f unix ${paths} && dprint check`
    scripts["lint-fix"] = `oxlint -c .oxlintrc.json --fix ${paths} && dprint fmt`
  }
  const check = [
    ...(hasAddon(config, "effect-style") ? [pm.run("lint")] : []),
    pm.run("check-types"),
    pm.run("test")
  ]
  scripts["check"] = check.join(" && ")
  if (
    (config.orm === "drizzle" || config.orm === "prisma") &&
    config.database !== "none" &&
    vfs.fileExists("packages/db/package.json")
  ) {
    scripts["db:generate"] = turboRun(config, "db:generate", "db")
  }
  if (hasAddon(config, "language-service")) {
    scripts["effect:diagnostics"] = "effect-language-service diagnostics --format json"
    if (!isLibraryTemplate(config)) {
      scripts["effect:diagnostics:server"] =
        "effect-language-service diagnostics --project apps/server/tsconfig.json --format json"
      scripts["effect:diagnostics:web"] =
        "effect-language-service diagnostics --project apps/web/tsconfig.json --format json"
    }
  }
  const prepare = [
    ...(hasAddon(config, "language-service") ? ["effect-language-service patch"] : []),
    ...(hasAddon(config, "effect-style") ? ["lefthook install"] : [])
  ]
  if (prepare.length > 0) scripts["prepare"] = prepare.join(" && ")
  return scripts
}

/** Root `name` becomes `projectName`. Workspace packages are `@<projectName>/<spine>`. */
export const processPackageConfigs = (vfs: VirtualFsService, config: ProjectConfig): void => {
  const rootPath = packageJsonPath("")
  const root = readPackage(vfs, rootPath)
  if (root === undefined) {
    throw new GeneratorError({
      phase: "package-configs",
      message: isLibraryTemplate(config)
        ? "library template did not write package.json"
        : "base template did not write package.json"
    })
  }
  root["name"] = config.projectName
  root["scripts"] = rootScripts(vfs, config)
  // Bun keeps a concrete pin. npm/pnpm use `@latest` here; the CLI overwrites with the
  // detected PATH version after writeTree (turbo requires a packageManager field).
  root["packageManager"] = config.packageManager === "bun"
    ? BUN_PACKAGE_MANAGER_PIN
    : `${config.packageManager}@latest`
  if (config.packageManager === "npm") {
    const allowScripts = getAllowedDependencyScripts(config)
    if (allowScripts.length > 0) root["allowScripts"] = [...allowScripts]
  }
  vfs.writeJson(rootPath, root)

  for (const [directory, name] of WORKSPACE_PACKAGES) {
    const path = packageJsonPath(directory)
    const pkg = readPackage(vfs, path)
    if (pkg === undefined) continue
    pkg["name"] = `@${config.projectName}/${name}`
    vfs.writeJson(path, pkg)
  }
}

import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import { hasAddon, hasFrontend } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"
import { addPackageDependency, asStringRecord, packageJsonPath, sortStringRecord } from "../utils/add-deps.ts"
import { processTurboConfig } from "./turbo-generator.ts"

type PackageJson = Record<string, unknown>

const workspaceProtocol = (config: ProjectConfig): string => config.packageManager === "npm" ? "*" : "workspace:*"

const linkWorkspacePackages = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  const protocol = workspaceProtocol(config)
  const scope = config.projectName
  const links: Readonly<Record<string, ReadonlyArray<string>>> = {
    "packages/protocol": ["domain"],
    "packages/db": ["config", "domain"],
    "packages/client": ["protocol"],
    "apps/server": ["config", "db", "domain", "protocol"],
    "apps/web": ["client", "config", "domain", "protocol", "server"]
  }
  for (const [directory, names] of Object.entries(links)) {
    const path = packageJsonPath(directory)
    if (!vfs.fileExists(path)) continue
    const parsed: unknown = vfs.readJson(path)
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) continue
    const pkg = parsed as PackageJson
    const dependencies = asStringRecord(pkg["dependencies"])
    for (const name of names) {
      const target = name.startsWith("packages/") || name.startsWith("apps/") ? name : packageJsonPath(
        name === "server" || name === "web" ? `apps/${name}` : `packages/${name}`
      )
      if (!vfs.fileExists(target)) continue
      dependencies[`@${scope}/${name}`] = protocol
    }
    pkg["dependencies"] = sortStringRecord(dependencies)
    vfs.writeJson(path, pkg)
  }
}

const rootDevDependencies = (config: ProjectConfig): Array<string> => {
  const names = ["typescript"]
  if (hasAddon(config, "turborepo")) names.push("turbo")
  if (hasAddon(config, "effect-style")) names.push("@oxlint/plugins", "dprint", "lefthook", "oxlint")
  if (hasAddon(config, "language-service")) names.push("@effect/language-service")
  if (hasAddon(config, "skills")) names.push("effect")
  return names
}

/**
 * Workspace links, then per-package dependencies from `dependencyVersionMap`, then `turbo.json`.
 * Versions are not written in templates.
 */
export const processDependencies = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  linkWorkspacePackages(vfs, config)

  addPackageDependency({
    vfs,
    packagePath: "",
    devDependencies: rootDevDependencies(config)
  })

  if (vfs.fileExists("packages/domain/package.json")) {
    addPackageDependency({
      vfs,
      packagePath: "packages/domain",
      dependencies: ["effect"],
      devDependencies: ["typescript"]
    })
  }

  if (vfs.fileExists("packages/protocol/package.json")) {
    addPackageDependency({
      vfs,
      packagePath: "packages/protocol",
      dependencies: ["effect"],
      devDependencies: ["typescript"]
    })
  }

  if (vfs.fileExists("packages/config/package.json")) {
    addPackageDependency({
      vfs,
      packagePath: "packages/config",
      dependencies: ["effect"],
      devDependencies: ["@types/bun", "@types/node", "typescript"]
    })
  }

  if (vfs.fileExists("packages/client/package.json")) {
    addPackageDependency({
      vfs,
      packagePath: "packages/client",
      dependencies: ["effect"],
      devDependencies: ["@types/bun", "typescript"]
    })
  }

  if (config.orm === "drizzle" && config.database === "sqlite" && vfs.fileExists("packages/db/package.json")) {
    const dependencies = ["drizzle-orm", "effect"]
    if (config.runtime === "bun") dependencies.unshift("@effect/platform-bun", "@effect/sql-sqlite-bun")
    addPackageDependency({
      vfs,
      packagePath: "packages/db",
      dependencies,
      devDependencies: ["@types/bun", "@types/node", "drizzle-kit", "typescript"]
    })
  }

  if (vfs.fileExists("apps/server/package.json")) {
    const dependencies = ["effect"]
    if (config.runtime === "bun") dependencies.unshift("@effect/platform-bun")
    addPackageDependency({
      vfs,
      packagePath: "apps/server",
      dependencies,
      devDependencies: ["@types/bun", "typescript"]
    })
  }

  if (hasAddon(config, "effect-style") && vfs.fileExists("packages/effect-oxc/package.json")) {
    addPackageDependency({
      vfs,
      packagePath: "packages/effect-oxc",
      dependencies: ["@oxlint/plugins"],
      devDependencies: ["typescript"]
    })
  }

  if (hasFrontend(config, "tanstack-start") && vfs.fileExists("apps/web/package.json")) {
    addPackageDependency({
      vfs,
      packagePath: "apps/web",
      dependencies: [
        "@effect/atom-react",
        "@tanstack/react-router",
        "@tanstack/react-start",
        "effect",
        "react",
        "react-dom",
        "scheduler"
      ],
      devDependencies: [
        "@types/bun",
        "@types/node",
        "@types/react",
        "@types/react-dom",
        "@vitejs/plugin-react",
        "typescript",
        "vite"
      ]
    })
  }

  processTurboConfig(vfs, config)
}

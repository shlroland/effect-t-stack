import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import { GeneratorError, type ProjectConfig } from "../types.ts"
import { asStringRecord, sortStringRecord } from "../utils/add-deps.ts"

type PackageJson = Record<string, unknown>

const PACKAGE_JSONS = [
  "package.json",
  "apps/server/package.json",
  "apps/web/package.json",
  "packages/api/package.json",
  "packages/domain/package.json",
  "packages/protocol/package.json",
  "packages/db/package.json",
  "packages/client/package.json",
  "packages/config/package.json"
] as const

const SECTIONS = ["dependencies", "devDependencies"] as const

const isDirectPin = (version: string): boolean =>
  version !== "catalog:" && version !== "*" && !version.startsWith("workspace:")

const readPackage = (vfs: VirtualFileSystem, path: string): PackageJson => {
  const parsed: unknown = vfs.readJson(path)
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new GeneratorError("catalogs", `${path} is not an object`)
  }
  return parsed as PackageJson
}

const presentPackages = (vfs: VirtualFileSystem): Array<{ readonly path: string; readonly pkg: PackageJson }> =>
  PACKAGE_JSONS.filter((path) => vfs.fileExists(path)).map((path) => ({ path, pkg: readPackage(vfs, path) }))

const workspacePackages = (pkg: PackageJson): Array<string> => {
  const workspaces = pkg["workspaces"]
  if (Array.isArray(workspaces)) return workspaces.filter((item): item is string => typeof item === "string")
  if (workspaces !== null && typeof workspaces === "object") {
    const packages = (workspaces as { packages?: unknown }).packages
    if (Array.isArray(packages)) return packages.filter((item): item is string => typeof item === "string")
  }
  return ["apps/*", "packages/*"]
}

/**
 * Hoist a dependency into the catalog when it appears in more than one package at the same version.
 * Bun writes `workspaces.catalog` and rewrites ranges to `catalog:`. npm skips the catalog.
 * pnpm writes `pnpm-workspace.yaml`.
 */
export const processCatalogs = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  const packages = presentPackages(vfs)
  const root = packages.find((entry) => entry.path === "package.json")
  if (root === undefined) return

  if (config.packageManager === "npm") {
    root.pkg["workspaces"] = workspacePackages(root.pkg)
    vfs.writeJson(root.path, root.pkg)
    return
  }

  const hits = new Map<string, { version: string; count: number; conflict: boolean }>()
  for (const entry of packages) {
    for (const section of SECTIONS) {
      for (const [name, version] of Object.entries(asStringRecord(entry.pkg[section]))) {
        if (!isDirectPin(version)) continue
        const current = hits.get(name)
        if (current === undefined) hits.set(name, { version, count: 1, conflict: false })
        else {
          current.count += 1
          if (current.version !== version) current.conflict = true
        }
      }
    }
  }

  const catalog: Record<string, string> = {}
  for (const [name, hit] of hits) {
    if (!hit.conflict && hit.count > 1) catalog[name] = hit.version
  }
  const sorted = sortStringRecord(catalog)

  for (const entry of packages) {
    for (const section of SECTIONS) {
      const record = asStringRecord(entry.pkg[section])
      if (Object.keys(record).length === 0 && entry.pkg[section] === undefined) continue
      let changed = false
      for (const name of Object.keys(record)) {
        if (sorted[name] !== undefined && record[name] === sorted[name]) {
          record[name] = "catalog:"
          changed = true
        }
      }
      if (changed) entry.pkg[section] = sortStringRecord(record)
    }
    vfs.writeJson(entry.path, entry.pkg)
  }

  if (config.packageManager === "pnpm") {
    const lines = ["packages:", ...workspacePackages(root.pkg).map((item) => `  - ${JSON.stringify(item)}`)]
    if (Object.keys(sorted).length > 0) {
      lines.push("catalog:")
      for (const [name, version] of Object.entries(sorted)) {
        lines.push(`  ${JSON.stringify(name)}: ${JSON.stringify(version)}`)
      }
    }
    vfs.writeFile("pnpm-workspace.yaml", `${lines.join("\n")}\n`)
    delete root.pkg["workspaces"]
    vfs.writeJson(root.path, root.pkg)
    return
  }

  if (Object.keys(sorted).length === 0) return
  root.pkg["workspaces"] = {
    packages: workspacePackages(root.pkg),
    catalog: sorted
  }
  vfs.writeJson(root.path, root.pkg)
}

import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import { GeneratorError } from "../types.ts"
import { pinnedVersion } from "./dependency-versions.ts"

export type AddPackageDependencyInput = {
  readonly vfs: VirtualFileSystem
  /** Package directory. `""` is the repo root. */
  readonly packagePath: string
  readonly dependencies?: ReadonlyArray<string>
  readonly devDependencies?: ReadonlyArray<string>
  /** Bypass `dependencyVersionMap` (intentional lags / workspace protocols). */
  readonly customDependencies?: Readonly<Record<string, string>>
  readonly customDevDependencies?: Readonly<Record<string, string>>
}

type PackageJson = Record<string, unknown>

export const sortStringRecord = (record: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)))

export const packageJsonPath = (packagePath: string): string =>
  packagePath.length === 0 ? "package.json" : `${packagePath}/package.json`

export const asStringRecord = (value: unknown): Record<string, string> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {}
  const record: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") record[key] = entry
  }
  return record
}

const readPackage = (vfs: VirtualFileSystem, path: string): PackageJson => {
  if (!vfs.fileExists(path)) {
    throw new GeneratorError("dependencies", `Missing ${path}`)
  }
  try {
    const parsed: unknown = vfs.readJson(path)
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new GeneratorError("dependencies", `${path} is not an object`)
    }
    return parsed as PackageJson
  } catch (cause) {
    if (cause instanceof GeneratorError) throw cause
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new GeneratorError("dependencies", `Invalid JSON in ${path}: ${message}`, { cause })
  }
}

/**
 * Look up each name in `dependencyVersionMap` and merge it into the package.
 * A name listed as both a runtime and a dev dependency stays in `dependencies` only.
 */
export const addPackageDependency = (input: AddPackageDependencyInput): void => {
  const path = packageJsonPath(input.packagePath)
  const pkg = readPackage(input.vfs, path)
  const dependencies = asStringRecord(pkg["dependencies"])
  const devDependencies = asStringRecord(pkg["devDependencies"])

  for (const name of input.dependencies ?? []) dependencies[name] = pinnedVersion(name)
  for (const [name, version] of Object.entries(input.customDependencies ?? {})) dependencies[name] = version
  for (const name of input.devDependencies ?? []) {
    if (name in dependencies) continue
    devDependencies[name] = pinnedVersion(name)
  }
  for (const [name, version] of Object.entries(input.customDevDependencies ?? {})) {
    if (name in dependencies) continue
    devDependencies[name] = version
  }
  for (const name of Object.keys(dependencies)) delete devDependencies[name]

  if (Object.keys(dependencies).length === 0) delete pkg["dependencies"]
  else pkg["dependencies"] = sortStringRecord(dependencies)
  if (Object.keys(devDependencies).length === 0) delete pkg["devDependencies"]
  else pkg["devDependencies"] = sortStringRecord(devDependencies)
  input.vfs.writeJson(path, pkg)
}

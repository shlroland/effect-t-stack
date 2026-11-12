import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { CreateError } from "./CreateError.ts"
import { loadFingerprint, writeFingerprint } from "./fingerprint.ts"
import { appendHistory } from "./history.ts"
import { toPackageScope } from "./projectName.ts"

export type AddPackageOptions = {
  readonly packageName: string
  readonly projectDir: string
  readonly dryRun: boolean
  readonly verbose: boolean
}

const packageJsonFor = (scope: string, name: string) =>
  JSON.stringify(
    {
      name: `@${scope}/${name}`,
      version: "0.0.0",
      private: true,
      type: "module",
      exports: {
        ".": "./src/index.ts"
      },
      scripts: {
        "check-types": "tsc --noEmit -p tsconfig.json"
      },
      dependencies: {
        effect: "catalog:"
      },
      devDependencies: {
        typescript: "catalog:"
      }
    },
    null,
    2
  ) + "\n"

const tsconfigFor = () =>
  JSON.stringify(
    {
      extends: "../config/tsconfig.base.json",
      include: ["src"]
    },
    null,
    2
  ) + "\n"

const indexTs = (name: string) =>
  `/** Workspace package @scope/${name} — scaffolded by create-effect-t-stack add --package. */\nexport {}\n`

export const addPackage = Effect.fn("addPackage")(function*(options: AddPackageOptions) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const projectDir = path.resolve(options.projectDir)
  const name = options.packageName.trim()
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return yield* new CreateError({
      message: `Invalid package name "${name}" (use lowercase kebab-case, e.g. billing)`
    })
  }

  const { path: etsPath, fingerprint } = yield* loadFingerprint(projectDir)
  const scope = toPackageScope(fingerprint.name ?? path.basename(projectDir))
  const pkgDir = path.join(projectDir, "packages", name)
  const exists = yield* fs.exists(pkgDir)
  if (exists) {
    return yield* new CreateError({ message: `Package directory already exists: ${pkgDir}` })
  }

  if (options.dryRun) {
    const result = {
      ok: true as const,
      action: "add-package",
      packageName: name,
      packageDir: pkgDir,
      scope: `@${scope}/${name}`,
      dryRun: true
    }
    if (options.verbose) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(`Dry run — would scaffold ${pkgDir}`)
    }
    return result
  }

  yield* fs.makeDirectory(path.join(pkgDir, "src"), { recursive: true })
  yield* fs.writeFileString(path.join(pkgDir, "package.json"), packageJsonFor(scope, name))
  yield* fs.writeFileString(path.join(pkgDir, "tsconfig.json"), tsconfigFor())
  yield* fs.writeFileString(path.join(pkgDir, "src/index.ts"), indexTs(name))

  const next = {
    ...fingerprint,
    cliVersion: fingerprint.cliVersion,
    reproducibleCommand: `create-effect-t-stack add --package ${name}`
  }
  // record under addonOptions.packages for additive history without new root keys
  const packages = Array.isArray((fingerprint.addonOptions as { packages?: unknown } | undefined)?.packages)
    ? [...((fingerprint.addonOptions as { packages: Array<string> }).packages)]
    : []
  if (!packages.includes(name)) {
    packages.push(name)
  }
  const written = {
    ...next,
    addonOptions: {
      ...fingerprint.addonOptions,
      packages
    },
    reproducibleCommand: `create-effect-t-stack add --package ${name}`
  }
  yield* writeFingerprint(etsPath, written)
  yield* appendHistory({
    at: new Date().toISOString(),
    command: written.reproducibleCommand!,
    projectDir,
    scope: `@${scope}/${name}`
  })

  const result = {
    ok: true as const,
    action: "add-package",
    packageName: name,
    packageDir: pkgDir,
    scope: `@${scope}/${name}`,
    dryRun: false
  }
  if (options.verbose) {
    yield* Console.log(JSON.stringify(result, null, 2))
  } else {
    yield* Console.log(`Scaffolded ${pkgDir} (@${scope}/${name})`)
  }
  return result
})

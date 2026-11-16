import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { ChildProcess } from "effect/process"
import { ChildProcessSpawner } from "effect/process/ChildProcessSpawner"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import { CreateError } from "../shared/CreateError.ts"
import type { PackageManager } from "../shared/enums.ts"

export type { PackageManager } from "../shared/enums.ts"

/** Minimal root package.json shape we stamp after generate. */
export const RootPackageJson = Schema.StructWithRest(
  Schema.Struct({
    packageManager: Schema.optionalKey(Schema.String)
  }),
  [Schema.Record(Schema.String, Schema.Unknown)]
)

export type RootPackageJson = typeof RootPackageJson.Type

const RootPackageJsonFromJsonString = Schema.fromJsonString(RootPackageJson)

export const installCommand = (
  pm: PackageManager
): { readonly command: string; readonly args: ReadonlyArray<string> } => {
  switch (pm) {
    case "bun":
      return { command: "bun", args: ["install"] }
    case "npm":
      return { command: "npm", args: ["install"] }
    case "pnpm":
      return { command: "pnpm", args: ["install"] }
  }
}

/**
 * Resolve `packageManager` pin the same way Better-T-Stack does:
 * local `pm --version`, else Corepack-friendly `"<pm>@latest"`.
 * (BTS does **not** hit the npm registry for this field.)
 */
export const resolvePackageManagerPin = Effect.fn("resolvePackageManagerPin")(function*(
  pm: PackageManager
) {
  const detected = yield* detectLocalPackageManagerVersion(pm)
  if (detected !== undefined) {
    return `${pm}@${detected}`
  }
  yield* Console.warn(
    `Warning: could not read \`${pm} --version\`; stamping packageManager "${pm}@latest".`
  )
  return `${pm}@latest`
})

const detectLocalPackageManagerVersion = Effect.fn("detectLocalPackageManagerVersion")(
  function*(pm: PackageManager) {
    const spawner = yield* ChildProcessSpawner
    const result = yield* Effect.scoped(
      Effect.gen(function*() {
        const handle = yield* spawner.spawn(ChildProcess.make(pm, ["--version"]))
        return yield* Effect.all({
          stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          code: handle.exitCode
        }, { concurrency: "unbounded" })
      })
    ).pipe(Effect.catch(() => Effect.succeed(undefined)))

    if (result === undefined || result.code !== 0) {
      return undefined
    }
    const version = result.stdout.trim().replace(/^v/i, "").split(/\s+/)[0]
    if (version === undefined || !/^\d+\.\d+\.\d+/.test(version)) {
      return undefined
    }
    return version
  }
)

/**
 * Stamp the detected npm/pnpm version. Bun keeps the generator's `packageManager` pin.
 * Workspace catalogs and `pnpm-workspace.yaml` are already written by the generator.
 */
export const emitPackageManagerArtifacts = Effect.fn("emitPackageManagerArtifacts")(
  function*(targetDir: string, pm: PackageManager) {
    if (pm === "bun") {
      return
    }

    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const rootPkgPath = path.join(targetDir, "package.json")
    const raw = yield* fs.readFileString(rootPkgPath)
    const pkg = yield* Schema.decodeUnknownEffect(RootPackageJsonFromJsonString)(raw).pipe(
      Effect.mapError((error) =>
        new CreateError({
          message: `Invalid package.json after generate: ${error.message}`
        })
      )
    )

    pkg["packageManager"] = yield* resolvePackageManagerPin(pm)
    yield* fs.writeFileString(rootPkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }
)

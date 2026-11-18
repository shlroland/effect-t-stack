import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Schema from "effect/Schema"
import { join } from "node:path"
import { cliPackageRoot } from "../packageRoot.ts"
import { CreateError } from "../shared/CreateError.ts"

const PackageJsonVersion = Schema.Struct({
  version: Schema.String
})

const PackageJsonVersionFromJsonString = Schema.fromJsonString(PackageJsonVersion)

const causeMessage = (error: unknown): string => error instanceof Error ? error.message : String(error)

/** CLI package version from `apps/cli/package.json` (via `cliPackageRoot` — works for src and dist). */
export const cliVersion = Effect.fn("cliVersion")(function*() {
  const fs = yield* FileSystem.FileSystem
  const pkgPath = join(cliPackageRoot, "package.json")
  const raw = yield* fs.readFileString(pkgPath).pipe(
    Effect.mapError((error) => new CreateError({ message: `Failed to read CLI package.json: ${causeMessage(error)}` }))
  )
  const pkg = yield* Schema.decodeUnknownEffect(PackageJsonVersionFromJsonString)(raw).pipe(
    Effect.mapError((error) => new CreateError({ message: `Invalid CLI package.json: ${causeMessage(error)}` }))
  )
  return pkg.version
})

export const ETS_SCHEMA_URL =
  "https://raw.githubusercontent.com/shlroland/effect-t-stack/main/apps/cli/schemas/ets.schema.json"

/** Fingerprint schema version (ets.jsonc `version` field). Independent of `cliVersion`. */
export const FINGERPRINT_SCHEMA_VERSION = 1 as const

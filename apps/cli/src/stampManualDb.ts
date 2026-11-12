import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"

/** L1 plumbing: stamp fingerprint only; real db-setup behavior is L4. */
export const stampManualDb = Effect.fn("stampManualDb")(function*(targetDir: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const etsPath = path.join(targetDir, "ets.jsonc")
  const raw = yield* fs.readFileString(etsPath)
  if (raw.includes("\"dbSetupOptions\"")) {
    return
  }
  const next = raw.replace(
    /("version"\s*:\s*\d+\s*,)/,
    `$1\n  "dbSetupOptions": { "mode": "manual" },`
  )
  yield* fs.writeFileString(etsPath, next)
})

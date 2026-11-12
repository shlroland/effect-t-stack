import * as Effect from "effect/Effect"
import { loadFingerprint, writeFingerprint } from "./fingerprint.ts"

/** Stamp dbSetupOptions.mode=manual; real db-setup behavior is L4. */
export const stampManualDb = Effect.fn("stampManualDb")(function*(targetDir: string) {
  const { path: etsPath, fingerprint } = yield* loadFingerprint(targetDir)
  if (fingerprint.dbSetupOptions?.mode === "manual") {
    return
  }
  yield* writeFingerprint(etsPath, {
    ...fingerprint,
    dbSetupOptions: { ...fingerprint.dbSetupOptions, mode: "manual" }
  })
})

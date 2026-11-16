import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"
import { homedir } from "node:os"
import { CreateError } from "../shared/CreateError.ts"

export const HistoryEntry = Schema.Struct({
  at: Schema.String,
  command: Schema.String,
  projectDir: Schema.optionalKey(Schema.String),
  scope: Schema.optionalKey(Schema.String)
})

export type HistoryEntry = typeof HistoryEntry.Type

const HistoryEntryFromJsonString = Schema.fromJsonString(HistoryEntry)

const HistoryPathOverride = Config.option(Config.String("ETS_HISTORY_PATH"))

const defaultHistoryPath = () => `${homedir()}/.config/create-effect-t-stack/history.jsonl`

/** Sync path for help text. Effects use `resolveHistoryPathEffect`. */
export const resolveHistoryPath = (): string => {
  const override = process.env["ETS_HISTORY_PATH"]
  if (override !== undefined && override.length > 0) {
    return override
  }
  return defaultHistoryPath()
}

const resolveHistoryPathEffect = Effect.fn("resolveHistoryPathEffect")(function*() {
  const override = yield* HistoryPathOverride
  if (Option.isSome(override) && override.value.length > 0) {
    return override.value
  }
  return defaultHistoryPath()
})

export const appendHistory = Effect.fn("appendHistory")(function*(entry: HistoryEntry) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const file = yield* resolveHistoryPathEffect()
  const dir = path.dirname(file)
  const line = `${JSON.stringify(entry)}\n`
  // Best-effort: history is local UX only — never fail create/add on write permission.
  yield* Effect.gen(function*() {
    yield* fs.makeDirectory(dir, { recursive: true })
    const exists = yield* fs.exists(file)
    if (exists) {
      const prev = yield* fs.readFileString(file)
      yield* fs.writeFileString(file, prev + line)
    } else {
      yield* fs.writeFileString(file, line)
    }
  }).pipe(Effect.catch(() => Effect.void))
})

export const readHistory = Effect.fn("readHistory")(function*(limit: number) {
  const fs = yield* FileSystem.FileSystem
  const file = yield* resolveHistoryPathEffect()
  const exists = yield* fs.exists(file)
  if (!exists) {
    return [] as Array<HistoryEntry>
  }
  const raw = yield* fs.readFileString(file)
  const entries: Array<HistoryEntry> = []
  for (const line of raw.split("\n")) {
    if (line.trim().length === 0) {
      continue
    }
    const decoded = Schema.decodeUnknownOption(HistoryEntryFromJsonString)(line)
    if (Option.isSome(decoded)) {
      entries.push(decoded.value)
    }
  }
  return limit <= 0 ? entries : entries.slice(-limit)
})

export const clearHistory = Effect.fn("clearHistory")(function*() {
  const fs = yield* FileSystem.FileSystem
  const file = yield* resolveHistoryPathEffect()
  const exists = yield* fs.exists(file)
  if (!exists) {
    return
  }
  yield* fs.remove(file).pipe(
    Effect.mapError((cause) =>
      new CreateError({
        message: `Failed to clear history: ${cause instanceof Error ? cause.message : String(cause)}`
      })
    )
  )
})

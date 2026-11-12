import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { homedir } from "node:os"
import { CreateError } from "./CreateError.ts"

export type HistoryEntry = {
  readonly at: string
  readonly command: string
  readonly projectDir?: string
  readonly scope?: string
}

/** Local-only history path (never uploaded). */
export const resolveHistoryPath = (): string => {
  const override = process.env["ETS_HISTORY_PATH"]
  if (override !== undefined && override.length > 0) {
    return override
  }
  return `${homedir()}/.config/create-effect-t-stack/history.jsonl`
}

export const appendHistory = Effect.fn("appendHistory")(function*(entry: HistoryEntry) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const file = resolveHistoryPath()
  const dir = path.dirname(file)
  yield* fs.makeDirectory(dir, { recursive: true })
  const line = `${JSON.stringify(entry)}\n`
  const exists = yield* fs.exists(file)
  if (exists) {
    const prev = yield* fs.readFileString(file)
    yield* fs.writeFileString(file, prev + line)
  } else {
    yield* fs.writeFileString(file, line)
  }
})

export const readHistory = Effect.fn("readHistory")(function*(limit: number) {
  const fs = yield* FileSystem.FileSystem
  const file = resolveHistoryPath()
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
    try {
      entries.push(JSON.parse(line) as HistoryEntry)
    } catch {
      // skip corrupt lines
    }
  }
  return limit <= 0 ? entries : entries.slice(-limit)
})

export const clearHistory = Effect.fn("clearHistory")(function*() {
  const fs = yield* FileSystem.FileSystem
  const file = resolveHistoryPath()
  const exists = yield* fs.exists(file)
  if (!exists) {
    return
  }
  yield* fs.remove(file).pipe(
    Effect.mapError(
      (cause) =>
        new CreateError({
          message: `Failed to clear history: ${cause instanceof Error ? cause.message : String(cause)}`
        })
    )
  )
})

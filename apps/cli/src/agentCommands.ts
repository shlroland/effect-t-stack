import * as Command from "effect/cli/Command"
import * as Flag from "effect/cli/Flag"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { addAddon } from "./addAddon.ts"
import { addPackage } from "./addPackage.ts"
import { createProject } from "./create.ts"
import { CreateError } from "./CreateError.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { clearHistory, readHistory, resolveHistoryPath } from "./history.ts"
import { emitSchema, type SchemaName } from "./schemaCommand.ts"

const readStdinJson = Effect.fn("readStdinJson")(function*() {
  const raw = yield* Effect.tryPromise({
    try: () => Bun.stdin.text().then((text) => text.trim()),
    catch: (cause) =>
      new CreateError({
        message: `Failed to read stdin: ${cause instanceof Error ? cause.message : String(cause)}`
      })
  })
  if (raw.length === 0) {
    return yield* new CreateError({ message: "Expected JSON on stdin" })
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch (cause) {
    return yield* new CreateError({
      message: `Invalid JSON on stdin: ${cause instanceof Error ? cause.message : String(cause)}`
    })
  }
})

const toCreateOptions = (input: Record<string, unknown>): Effect.Effect<CreateOptions, CreateError> => {
  const projectName = input["projectName"]
  if (typeof projectName !== "string" || projectName.length === 0) {
    return Effect.fail(new CreateError({ message: "create-json requires projectName: string" }))
  }
  return Effect.succeed({
    projectName,
    yes: input["yes"] !== false,
    yolo: Boolean(input["yolo"]),
    dryRun: Boolean(input["dryRun"]),
    verbose: true,
    install: input["install"] !== false,
    git: input["git"] !== false,
    renderTitle: false,
    open: typeof input["open"] === "string" ? input["open"] : undefined,
    manualDb: Boolean(input["manualDb"]),
    directoryConflict: (input["directoryConflict"] as CreateOptions["directoryConflict"]) ?? "error",
    packageManager: (input["packageManager"] as CreateOptions["packageManager"]) ?? "bun",
    api: (input["api"] as CreateOptions["api"]) ?? "rpc",
    effectStyle: input["effectStyle"] !== false,
    cwd: typeof input["cwd"] === "string" ? input["cwd"] : undefined
  })
}

export const createJsonCommand = Command.make("create-json").pipe(
  Command.withDescription("Agent contract: create from JSON stdin; always prints CreateResult JSON"),
  Command.withHandler(() =>
    readStdinJson().pipe(
      Effect.flatMap(toCreateOptions),
      Effect.flatMap(createProject),
      Effect.asVoid
    )
  )
)

export const addJsonCommand = Command.make("add-json").pipe(
  Command.withDescription(
    "Agent contract: add from JSON stdin ({ addon } | { packageName }) → JSON result"
  ),
  Command.withHandler(() =>
    Effect.gen(function*() {
      const input = yield* readStdinJson()
      const projectDir = typeof input["projectDir"] === "string" ? input["projectDir"] : "."
      const dryRun = Boolean(input["dryRun"])
      const packageName = input["packageName"]
      const addon = input["addon"]

      if (typeof packageName === "string") {
        yield* addPackage({ packageName, projectDir, dryRun, verbose: true })
        return
      }
      if (typeof addon === "string") {
        yield* addAddon({ addon, projectDir, dryRun, verbose: true })
        return
      }
      return yield* new CreateError({
        message: "add-json requires { \"addon\": string } or { \"packageName\": string }"
      })
    })
  )
)

const schemaName = Flag.Literals(
  "name",
  [
    "all",
    "createInput",
    "addonOptions",
    "fingerprint"
  ] as const
).pipe(
  Flag.withDescription("Which schema document to print"),
  Flag.withDefault("all" as const)
)

export const schemaCommand = Command.make("schema", { schemaName }).pipe(
  Command.withDescription("Print JSON Schema documents for agents / editors"),
  Command.withHandler((config) => emitSchema(config.schemaName as SchemaName).pipe(Effect.asVoid))
)

const historyLimit = Flag.Int("limit").pipe(
  Flag.withDescription("Max entries to print (from the end)"),
  Flag.withDefault(20)
)
const historyJson = Flag.Boolean("json").pipe(Flag.withDefault(false))
const historyClear = Flag.Boolean("clear").pipe(
  Flag.withDescription("Delete local history file (never uploaded)"),
  Flag.withDefault(false)
)

export const historyCommand = Command.make("history", {
  historyLimit,
  historyJson,
  historyClear
}).pipe(
  Command.withDescription(
    `Local-only create/add history (${resolveHistoryPath()}) — not uploaded; privacy: machine-local JSONL`
  ),
  Command.withHandler((config) =>
    Effect.gen(function*() {
      if (config.historyClear) {
        yield* clearHistory()
        yield* Console.log(`Cleared ${resolveHistoryPath()}`)
        return
      }
      const entries = yield* readHistory(config.historyLimit)
      if (config.historyJson) {
        yield* Console.log(JSON.stringify(entries, null, 2))
      } else if (entries.length === 0) {
        yield* Console.log("No local history.")
      } else {
        for (const entry of entries) {
          yield* Console.log(
            `${entry.at}  ${entry.command}${entry.projectDir ? `  (${entry.projectDir})` : ""}`
          )
        }
      }
    })
  )
)

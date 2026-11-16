import * as Command from "effect/cli/Command"
import * as Flag from "effect/cli/Flag"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { addAddon } from "../add/addAddon.ts"
import { addPackage } from "../add/addPackage.ts"
import { resolveAddInput } from "../compatibility/index.ts"
import { createProject } from "../create/create.ts"
import { clearHistory, readHistory, resolveHistoryPath } from "../fingerprint/history.ts"
import { CreateError } from "../shared/CreateError.ts"
import { decodeAddJsonInput, decodeCreateJsonInput, toCreateOptions } from "./agentSchemas.ts"
import { emitSchema, type SchemaName } from "./schemaCommand.ts"

const readStdinText = Effect.fn("readStdinText")(function*() {
  return yield* Effect.tryPromise({
    try: () => Bun.stdin.text().then((text) => text.trim()),
    catch: (cause) =>
      new CreateError({
        message: `Failed to read stdin: ${cause instanceof Error ? cause.message : String(cause)}`
      })
  })
})

export const createJsonCommand = Command.make("create-json").pipe(
  Command.withDescription("Agent contract: create from JSON stdin; always prints CreateResult JSON"),
  Command.withHandler(() =>
    readStdinText().pipe(
      Effect.flatMap(decodeCreateJsonInput),
      Effect.map(toCreateOptions),
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
      const input = yield* readStdinText().pipe(Effect.flatMap(decodeAddJsonInput))
      const resolved = yield* resolveAddInput({
        packageName: input.packageName,
        addon: input.addon
      })

      if (resolved.kind === "package") {
        yield* addPackage({
          packageName: resolved.packageName,
          projectDir: input.projectDir,
          dryRun: input.dryRun,
          verbose: true
        })
        return
      }
      yield* addAddon({
        addon: resolved.addon,
        projectDir: input.projectDir,
        dryRun: input.dryRun,
        verbose: true
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

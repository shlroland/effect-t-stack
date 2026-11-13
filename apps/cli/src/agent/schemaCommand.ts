import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { fileURLToPath } from "node:url"
import type { CreateOptions } from "../create/CreateOptions.ts"
import { DEFAULT_ADDONS } from "../fingerprint/fingerprint.ts"
import { CreateError } from "../shared/CreateError.ts"

export type SchemaName = "all" | "createInput" | "addonOptions" | "fingerprint"

const createInputSchema = {
  $id: "create-effect-t-stack/createInput",
  type: "object",
  required: ["projectName"],
  properties: {
    projectName: { type: "string" },
    yes: { type: "boolean" },
    yolo: { type: "boolean" },
    dryRun: { type: "boolean" },
    verbose: { type: "boolean" },
    install: { type: "boolean" },
    git: { type: "boolean" },
    packageManager: { type: "string", enum: ["bun", "npm", "pnpm"] },
    api: { type: "string", enum: ["rpc", "httpapi"] },
    effectStyle: { type: "boolean" },
    directoryConflict: {
      type: "string",
      enum: ["error", "overwrite", "increment", "merge"]
    },
    manualDb: { type: "boolean" },
    open: { type: "string" }
  }
} as const

const addonOptionsSchema = {
  $id: "create-effect-t-stack/addonOptions",
  type: "object",
  description: "Per-addon options nested under ets.jsonc addonOptions",
  properties: Object.fromEntries(
    DEFAULT_ADDONS.map((name) => [name, { type: "object", additionalProperties: true }])
  ),
  additionalProperties: true
}

export const emitSchema = Effect.fn("emitSchema")(function*(name: SchemaName) {
  if (name === "createInput") {
    yield* Console.log(JSON.stringify(createInputSchema, null, 2))
    return createInputSchema
  }
  if (name === "addonOptions") {
    yield* Console.log(JSON.stringify(addonOptionsSchema, null, 2))
    return addonOptionsSchema
  }

  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const here = path.dirname(fileURLToPath(import.meta.url))
  const schemaPath = path.join(here, "../../schemas/ets.schema.json")
  const exists = yield* fs.exists(schemaPath)
  if (!exists) {
    return yield* new CreateError({
      message: `Fingerprint schema missing at ${schemaPath} (packaged under schemas/)`
    })
  }
  const raw = yield* fs.readFileString(schemaPath)
  if (name === "fingerprint" || name === "all") {
    if (name === "all") {
      const all = {
        fingerprint: JSON.parse(raw),
        createInput: createInputSchema,
        addonOptions: addonOptionsSchema
      }
      yield* Console.log(JSON.stringify(all, null, 2))
      return all
    }
    yield* Console.log(raw)
    return JSON.parse(raw)
  }
  return yield* new CreateError({ message: `Unknown schema name: ${name}` })
})

/** Stable shape for create-json agents (mirrors CreateOptions). */
export type CreateJsonInput = Partial<CreateOptions> & {
  readonly projectName: string
}

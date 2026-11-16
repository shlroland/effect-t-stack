import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { fileURLToPath } from "node:url"
import { CreateError } from "../shared/CreateError.ts"
import { addonOptionsJsonSchema, createInputJsonSchema } from "./agentSchemas.ts"

export type SchemaName = "all" | "createInput" | "addonOptions" | "fingerprint"

const loadFingerprintSchema = Effect.fn("loadFingerprintSchema")(function*() {
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
  return JSON.parse(raw) as Record<string, unknown>
})

export const emitSchema = Effect.fn("emitSchema")(function*(name: SchemaName) {
  if (name === "createInput") {
    const schema = createInputJsonSchema()
    yield* Console.log(JSON.stringify(schema, null, 2))
    return schema
  }
  if (name === "addonOptions") {
    const schema = addonOptionsJsonSchema()
    yield* Console.log(JSON.stringify(schema, null, 2))
    return schema
  }

  const fingerprint = yield* loadFingerprintSchema()
  if (name === "fingerprint") {
    yield* Console.log(JSON.stringify(fingerprint, null, 2))
    return fingerprint
  }
  if (name === "all") {
    const all = {
      fingerprint,
      createInput: createInputJsonSchema(),
      addonOptions: addonOptionsJsonSchema()
    }
    yield* Console.log(JSON.stringify(all, null, 2))
    return all
  }
  return yield* new CreateError({ message: `Unknown schema name: ${name}` })
})

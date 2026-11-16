import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { fingerprintJsonSchema } from "../fingerprint/FingerprintSchema.ts"
import { CreateError } from "../shared/CreateError.ts"
import { addonOptionsJsonSchema, createInputJsonSchema } from "./agentSchemas.ts"

export type SchemaName = "all" | "createInput" | "addonOptions" | "fingerprint"

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
  if (name === "fingerprint") {
    const schema = fingerprintJsonSchema()
    yield* Console.log(JSON.stringify(schema, null, 2))
    return schema
  }
  if (name === "all") {
    const all = {
      fingerprint: fingerprintJsonSchema(),
      createInput: createInputJsonSchema(),
      addonOptions: addonOptionsJsonSchema()
    }
    yield* Console.log(JSON.stringify(all, null, 2))
    return all
  }
  return yield* new CreateError({ message: `Unknown schema name: ${name}` })
})

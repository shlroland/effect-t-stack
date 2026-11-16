import * as Effect from "effect/Effect"
import * as JsonSchema from "effect/JsonSchema"
import * as Schema from "effect/Schema"
import { CreateError } from "../shared/CreateError.ts"
import { DbSetupModeSchema } from "../shared/enums.ts"
import { ETS_SCHEMA_URL } from "./cliVersion.ts"

const LooseObject = Schema.Record(Schema.String, Schema.Unknown)

const DbSetupOptions = Schema.StructWithRest(
  Schema.Struct({
    mode: Schema.optionalKey(DbSetupModeSchema)
  }),
  [LooseObject]
)

/**
 * Fingerprint fields matching `docs/fingerprint.md` / packaged JSON Schema.
 * Stack dims required; meta + options optional; unknown keys kept via StructWithRest.
 */
export const FingerprintFields = Schema.Struct({
  version: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)).annotate({
    description: "Fingerprint schema version (not CLI semver)"
  }),
  runtime: Schema.String,
  api: Schema.String,
  database: Schema.String,
  orm: Schema.String,
  auth: Schema.String,
  frontend: Schema.String,
  backend: Schema.String,
  addons: Schema.Array(Schema.String),
  name: Schema.optionalKey(Schema.String),
  effect: Schema.optionalKey(Schema.String),
  apiOptions: Schema.optionalKey(LooseObject),
  ormOptions: Schema.optionalKey(LooseObject),
  frontendOptions: Schema.optionalKey(LooseObject),
  backendOptions: Schema.optionalKey(LooseObject),
  env: Schema.optionalKey(LooseObject),
  addonOptions: Schema.optionalKey(LooseObject),
  examples: Schema.optionalKey(Schema.Array(Schema.String)),
  packageManager: Schema.optionalKey(Schema.String),
  createdAt: Schema.optionalKey(Schema.String).annotate({
    description: "Create-time stamp written by the generator"
  }),
  cliVersion: Schema.optionalKey(Schema.String).annotate({
    description: "create-effect-t-stack release that wrote/updated this file"
  }),
  reproducibleCommand: Schema.optionalKey(Schema.String).annotate({
    description: "Command that produced or last updated this fingerprint"
  }),
  dbSetupOptions: Schema.optionalKey(DbSetupOptions),
  webDeploy: Schema.optionalKey(Schema.String),
  serverDeploy: Schema.optionalKey(Schema.String),
  ["$schema"]: Schema.optionalKey(Schema.String).annotate({
    description: "Optional JSON Schema URL for editor UX"
  })
})

export const Fingerprint = Schema.StructWithRest(FingerprintFields, [LooseObject]).annotate({
  title: "effect-t-stack fingerprint (ets.jsonc)",
  description:
    "Stack fingerprint for create-effect-t-stack. version = schema version (not CLI release). See docs/fingerprint.md."
})

export type Fingerprint = typeof Fingerprint.Type

/** JSON text (after JSONC strip) → Fingerprint. */
export const FingerprintFromJsonString = Schema.fromJsonString(Fingerprint)

export const fingerprintJsonSchema = (): Record<string, unknown> => {
  const document = Schema.toJsonSchemaDocument(Fingerprint)
  return {
    $schema: JsonSchema.META_SCHEMA_URI_DRAFT_2020_12,
    $id: ETS_SCHEMA_URL,
    ...document.schema,
    ...(Object.keys(document.definitions).length > 0 ? { $defs: document.definitions } : {})
  }
}

export const decodeFingerprintJson = (
  jsonText: string
): Effect.Effect<Fingerprint, CreateError> =>
  Schema.decodeUnknownEffect(FingerprintFromJsonString)(jsonText).pipe(
    Effect.mapError((error) => new CreateError({ message: `Failed to parse ets.jsonc: ${error.message}` }))
  )

export const decodeFingerprintJsonSync = (jsonText: string): Fingerprint =>
  Schema.decodeUnknownSync(FingerprintFromJsonString)(jsonText)

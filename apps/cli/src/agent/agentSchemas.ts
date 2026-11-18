import * as Effect from "effect/Effect"
import * as JsonSchema from "effect/JsonSchema"
import * as Schema from "effect/Schema"
import type { CreateOptions } from "../create/CreateOptions.ts"
import { DEFAULT_ADDONS } from "../fingerprint/fingerprint.ts"
import { CreateError } from "../shared/CreateError.ts"
import { ApiPrimarySchema, DatabaseSchema, DirectoryConflictSchema, PackageManagerSchema } from "../shared/enums.ts"

export { ApiPrimarySchema, DatabaseSchema, DirectoryConflictSchema, PackageManagerSchema } from "../shared/enums.ts"

const boolWithDefault = (defaultValue: boolean) =>
  Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(defaultValue)))

/**
 * Agent stdin for `create-json`. Single source for decode + `schema --name createInput`.
 * Defaults mirror the previous hand-rolled `toCreateOptions` mapping.
 */
export const CreateJsonInput = Schema.Struct({
  projectName: Schema.NonEmptyString,
  yes: boolWithDefault(true),
  yolo: boolWithDefault(false),
  dryRun: boolWithDefault(false),
  install: boolWithDefault(true),
  git: boolWithDefault(true),
  packageManager: PackageManagerSchema.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed("bun" as const))
  ),
  api: ApiPrimarySchema.pipe(Schema.withDecodingDefaultKey(Effect.succeed("rpc" as const))),
  database: DatabaseSchema.pipe(Schema.withDecodingDefaultKey(Effect.succeed("sqlite" as const))),
  effectStyle: boolWithDefault(true),
  directoryConflict: DirectoryConflictSchema.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed("error" as const))
  ),
  manualDb: boolWithDefault(false),
  open: Schema.optionalKey(Schema.String),
  cwd: Schema.optionalKey(Schema.String)
}).annotate({
  description: "Agent stdin for create-json (maps to CreateOptions; verbose/renderTitle are forced)"
})

export type CreateJsonInput = typeof CreateJsonInput.Type

/** JSON string → `CreateJsonInput` (stdin for `create-json`). */
export const CreateJsonInputFromJsonString = Schema.fromJsonString(CreateJsonInput)

/** Agent stdin for `add-json`: exactly one of `addon` | `packageName` (enforced after decode). */
export const AddJsonInput = Schema.Struct({
  projectDir: Schema.String.pipe(Schema.withDecodingDefaultKey(Effect.succeed("."))),
  dryRun: boolWithDefault(false),
  packageName: Schema.optionalKey(Schema.String),
  addon: Schema.optionalKey(Schema.String)
}).annotate({
  description: "Agent stdin for add-json ({ addon } | { packageName })"
})

export type AddJsonInput = typeof AddJsonInput.Type

/** JSON string → `AddJsonInput` (stdin for `add-json`). */
export const AddJsonInputFromJsonString = Schema.fromJsonString(AddJsonInput)

const addonOptionValue = Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown))

/** Documentation schema for nested `ets.jsonc` addonOptions (emit only). */
export const AddonOptions = Schema.Struct(
  Object.fromEntries(DEFAULT_ADDONS.map((name) => [name, addonOptionValue])) as {
    readonly [K in (typeof DEFAULT_ADDONS)[number]]: typeof addonOptionValue
  }
).annotate({
  description: "Per-addon options nested under ets.jsonc addonOptions"
})

export type AddonOptions = typeof AddonOptions.Type

export const toAgentJsonSchema = (schema: Schema.Constraint, $id: string): Record<string, unknown> => {
  const document = Schema.toJsonSchemaDocument(schema)
  return {
    $schema: JsonSchema.META_SCHEMA_URI_DRAFT_2020_12,
    $id,
    ...document.schema,
    ...(Object.keys(document.definitions).length > 0 ? { $defs: document.definitions } : {})
  }
}

export const createInputJsonSchema = (): Record<string, unknown> =>
  toAgentJsonSchema(CreateJsonInput, "create-effect-t-stack/createInput")

export const addonOptionsJsonSchema = (): Record<string, unknown> =>
  toAgentJsonSchema(AddonOptions, "create-effect-t-stack/addonOptions")

/** Decode `create-json` stdin (JSON text). Empty input fails with a clear CreateError. */
export const decodeCreateJsonInput = (
  raw: string
): Effect.Effect<CreateJsonInput, CreateError> => {
  if (raw.length === 0) {
    return Effect.fail(new CreateError({ message: "Expected JSON on stdin" }))
  }
  return Schema.decodeUnknownEffect(CreateJsonInputFromJsonString)(raw).pipe(
    Effect.mapError((error) => new CreateError({ message: `Invalid create-json input: ${error.message}` }))
  )
}

/** Decode `add-json` stdin (JSON text). Empty input fails with a clear CreateError. */
export const decodeAddJsonInput = (raw: string): Effect.Effect<AddJsonInput, CreateError> => {
  if (raw.length === 0) {
    return Effect.fail(new CreateError({ message: "Expected JSON on stdin" }))
  }
  return Schema.decodeUnknownEffect(AddJsonInputFromJsonString)(raw).pipe(
    Effect.mapError((error) => new CreateError({ message: `Invalid add-json input: ${error.message}` }))
  )
}

/** Map decoded agent input → create pipeline options (`verbose` / `renderTitle` fixed for agents). */
export const toCreateOptions = (input: CreateJsonInput): CreateOptions => ({
  projectName: input.projectName,
  yes: input.yes,
  yolo: input.yolo,
  dryRun: input.dryRun,
  verbose: true,
  install: input.install,
  git: input.git,
  renderTitle: false,
  open: input.open,
  manualDb: input.manualDb,
  directoryConflict: input.directoryConflict,
  packageManager: input.packageManager,
  api: input.api,
  database: input.database,
  effectStyle: input.effectStyle,
  cwd: input.cwd
})

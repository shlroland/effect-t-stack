import * as Effect from "effect/Effect"
import type { CreateOptions } from "../create/CreateOptions.ts"
import { CreateError } from "../shared/CreateError.ts"
import { CREATE_APIS, CREATE_DIRECTORY_CONFLICTS, CREATE_PACKAGE_MANAGERS, ruleMessage } from "./catalog.ts"

const isOneOf = <T extends string>(value: string, allowed: ReadonlyArray<T>): value is T =>
  (allowed as ReadonlyArray<string>).includes(value)

/** Stage: enums — catch create-json / hand-built options that bypass Flag.Literals. */
const validateCreateEnums = (options: CreateOptions): Effect.Effect<void, CreateError> => {
  if (!isOneOf(options.packageManager, CREATE_PACKAGE_MANAGERS)) {
    return Effect.fail(new CreateError({ message: ruleMessage("create.enums.packageManager") }))
  }
  if (!isOneOf(options.api, CREATE_APIS)) {
    return Effect.fail(new CreateError({ message: ruleMessage("create.enums.api") }))
  }
  if (!isOneOf(options.directoryConflict, CREATE_DIRECTORY_CONFLICTS)) {
    return Effect.fail(new CreateError({ message: ruleMessage("create.enums.directoryConflict") }))
  }
  return Effect.void
}

/** Stage: combinations — only the default stack cell is implemented. */
const validateCreateCombinations = (options: CreateOptions): Effect.Effect<void, CreateError> => {
  if (options.api !== "rpc") {
    return Effect.fail(new CreateError({ message: ruleMessage("create.combinations.api.rpc-only") }))
  }
  return Effect.void
}

/** Stage: auth/addons — effect-style omit path waits for L3. */
const validateCreateAuthAddons = (options: CreateOptions): Effect.Effect<void, CreateError> => {
  if (!options.effectStyle) {
    return Effect.fail(new CreateError({ message: ruleMessage("create.addons.effect-style.required") }))
  }
  return Effect.void
}

/**
 * Compatibility engine entry for `create` / `create-json`.
 * Order: enums → combinations → auth/addons (examples deferred to L3).
 */
export const validateCreateOptions = (options: CreateOptions): Effect.Effect<void, CreateError> =>
  validateCreateEnums(options).pipe(
    Effect.andThen(validateCreateCombinations(options)),
    Effect.andThen(validateCreateAuthAddons(options))
  )

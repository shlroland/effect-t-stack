import * as Effect from "effect/Effect"
import { CreateError } from "./CreateError.ts"
import type { CreateOptions } from "./CreateOptions.ts"

/** L1 capability guards — non-default matrix cells fail clearly until L3. */
export const validateCreateOptions = (options: CreateOptions): Effect.Effect<void, CreateError> => {
  if (options.api !== "rpc") {
    return Effect.fail(
      new CreateError({
        message:
          "api=httpapi primary flip is not implemented in L1 (golden is rpc-primary). Flag accepted for plumbing; matrix completeness is L3."
      })
    )
  }
  if (!options.effectStyle) {
    return Effect.fail(
      new CreateError({
        message:
          "Omitting effect-style at create is not implemented in L1 (golden ships with it). Keep --effect-style (default) until L3 addon omit path lands."
      })
    )
  }
  return Effect.void
}

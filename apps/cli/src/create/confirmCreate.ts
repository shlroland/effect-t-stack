import * as Prompt from "effect/cli/Prompt"
import * as Effect from "effect/Effect"
import { CreateError } from "../shared/CreateError.ts"
import { type CreateOptions, skipsConfirmation } from "./CreateOptions.ts"

export const confirmCreate = Effect.fn("confirmCreate")(function*(
  options: CreateOptions,
  scope: string
) {
  if (skipsConfirmation(options)) {
    return
  }
  const confirmed = yield* Prompt.run(
    Prompt.Confirm({
      message: `Create project "${scope}" from the Golden Sample?`,
      initial: true
    })
  )
  if (!confirmed) {
    return yield* new CreateError({ message: "Aborted." })
  }
})

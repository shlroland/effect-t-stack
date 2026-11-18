import * as Prompt from "effect/cli/Prompt"
import * as Effect from "effect/Effect"
import { toPackageScope } from "../template/projectName.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { skipsConfirmation } from "./CreateOptions.ts"

const projectNamePrompt = Prompt.String({
  message: "Project name",
  validate: (value) =>
    Effect.try({
      try: () => toPackageScope(value),
      catch: (cause) => cause instanceof Error ? cause.message : String(cause)
    })
})

/**
 * Interactive gate before generate. Declining confirmation re-prompts for a
 * project name (validated as an npm scope segment) and asks again.
 * Returns the confirmed scope (may differ from the initial one).
 */
export const confirmCreate = Effect.fn("confirmCreate")(function*(
  options: CreateOptions,
  scope: string
) {
  if (skipsConfirmation(options)) {
    return scope
  }
  let current = scope
  for (;;) {
    const confirmed = yield* Prompt.Confirm({
      message: `Create project "${current}"?`,
      initial: true
    })
    if (confirmed) {
      return current
    }
    current = yield* projectNamePrompt
  }
})

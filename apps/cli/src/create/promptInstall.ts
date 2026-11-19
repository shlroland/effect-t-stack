import * as Prompt from "effect/cli/Prompt"
import * as Effect from "effect/Effect"
import type { CreateOptions } from "./CreateOptions.ts"
import { skipsConfirmation } from "./CreateOptions.ts"

/**
 * Interactive install toggle (`--install` / `--no-install`).
 * Skipped under `--yes` / `--yolo` / `--dry-run`.
 */
export const promptInstall = Effect.fn("promptInstall")(function*(
  options: CreateOptions
) {
  if (skipsConfirmation(options)) {
    return options.install
  }
  return yield* Prompt.Confirm({
    message: "Install dependencies after create?",
    initial: options.install
  })
})

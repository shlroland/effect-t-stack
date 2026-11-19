import * as Prompt from "effect/cli/Prompt"
import * as Effect from "effect/Effect"
import type { CreateOptions } from "./CreateOptions.ts"
import { skipsConfirmation } from "./CreateOptions.ts"

/**
 * Interactive git-init toggle (`--git` / `--no-git`).
 * Skipped under `--yes` / `--yolo` / `--dry-run`.
 */
export const promptGit = Effect.fn("promptGit")(function*(
  options: CreateOptions
) {
  if (skipsConfirmation(options)) {
    return options.git
  }
  return yield* Prompt.Confirm({
    message: "Initialize a git repository?",
    initial: options.git
  })
})

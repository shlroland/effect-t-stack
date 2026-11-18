import * as Prompt from "effect/cli/Prompt"
import * as Effect from "effect/Effect"
import type { PackageManager } from "../shared/enums.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { skipsConfirmation } from "./CreateOptions.ts"

/**
 * Interactive package-manager choice. Skipped under `--yes` / `--yolo` / `--dry-run`.
 */
export const promptPackageManager = Effect.fn("promptPackageManager")(function*(
  options: CreateOptions
) {
  if (skipsConfirmation(options)) {
    return options.packageManager
  }
  return yield* Prompt.Select<PackageManager>({
    message: "Package manager?",
    choices: [
      {
        title: "bun",
        value: "bun",
        description: "Default for Scaffold Product and generated apps",
        selected: options.packageManager === "bun"
      },
      {
        title: "npm",
        value: "npm",
        description: "Explicit pins; stamps packageManager from PATH",
        selected: options.packageManager === "npm"
      },
      {
        title: "pnpm",
        value: "pnpm",
        description: "Workspace catalog + allowBuilds",
        selected: options.packageManager === "pnpm"
      }
    ]
  })
})

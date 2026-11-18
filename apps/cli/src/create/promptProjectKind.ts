import * as Prompt from "effect/cli/Prompt"
import * as Effect from "effect/Effect"
import type { TemplateId } from "../shared/enums.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { skipsConfirmation } from "./CreateOptions.ts"

/** Selectable project shapes. Backend/frontend-only are shown disabled until L3 cells land. */
type ProjectKind = "fullstack" | "library" | "backend" | "frontend"

const templateFromKind = (kind: ProjectKind): TemplateId => {
  switch (kind) {
    case "library":
      return "library"
    case "fullstack":
      return "default"
    case "backend":
    case "frontend":
      // Disabled choices beep on submit and cannot be returned.
      return "default"
  }
}

/**
 * Interactive first question: full-stack vs library (default stack dims).
 * Skipped under `--yes` / `--yolo` / `--dry-run`.
 */
export const promptProjectKind = Effect.fn("promptProjectKind")(function*(
  options: CreateOptions
) {
  if (skipsConfirmation(options)) {
    return options.template
  }
  const kind = yield* Prompt.Select<ProjectKind>({
    message: "What kind of project?",
    choices: [
      {
        title: "Full-stack app",
        value: "fullstack",
        description: "TanStack Start + Effect Rpc/HttpApi (default)",
        selected: options.template === "default"
      },
      {
        title: "Effect library",
        value: "library",
        description: "Publishable single-package Effect library",
        selected: options.template === "library"
      },
      {
        title: "Backend only",
        value: "backend",
        description: "Coming soon — API without frontend",
        disabled: true
      },
      {
        title: "Frontend only",
        value: "frontend",
        description: "Coming soon — UI without backend",
        disabled: true
      }
    ]
  })
  return templateFromKind(kind)
})

import * as Command from "effect/cli/Command"
import { addCommand } from "./addCommand.ts"
import { addJsonCommand, createJsonCommand, historyCommand, schemaCommand } from "./agentCommands.ts"
import { createCommand } from "./createCommand.ts"

/**
 * Root CLI. Prefer subcommands (`create`, `add`, …).
 * `bin.ts` rewrites bare `my-app --yes` → `create my-app --yes` for bunx UX.
 */
export const createEffectTStack = Command.make("create-effect-t-stack").pipe(
  Command.withDescription(
    "Scaffold and evolve Effect v4 apps from the Golden Sample (create · add · agent JSON)"
  ),
  Command.withSubcommands([
    createCommand,
    addCommand,
    createJsonCommand,
    addJsonCommand,
    schemaCommand,
    historyCommand
  ])
)

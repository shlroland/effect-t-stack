import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { type CopyPlan, executeCopy } from "./copyGolden.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { emitPackageManagerArtifacts, installCommand } from "./packageManagers.ts"
import { runCommand } from "./runCommand.ts"
import { stampManualDb } from "./stampManualDb.ts"

export const materializeProject = Effect.fn("materializeProject")(function*(input: {
  readonly options: CreateOptions
  readonly cwd: string
  readonly plan: CopyPlan
  readonly phases: Array<string>
}) {
  const { options, cwd, plan, phases } = input
  const quiet = options.verbose

  phases.push("copy")
  yield* executeCopy(plan)

  if (options.manualDb) {
    phases.push("stamp-manual-db")
    yield* stampManualDb(plan.targetDir)
  }

  phases.push("package-manager-artifacts")
  yield* emitPackageManagerArtifacts(plan.targetDir, options.packageManager)

  if (!quiet) {
    yield* Console.log(`Copied ${plan.files.length} files.`)
  }

  if (options.git) {
    phases.push("git-init")
    yield* runCommand("git", ["init"], { cwd: plan.targetDir, quiet })
  }

  if (options.install) {
    phases.push("install")
    const { command, args } = installCommand(options.packageManager)
    yield* runCommand(command, args, { cwd: plan.targetDir, quiet })
  }

  if (options.open !== undefined && options.open.length > 0) {
    phases.push("open")
    yield* runCommand(options.open, [plan.targetDir], { cwd, quiet })
  }
})

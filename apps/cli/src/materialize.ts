import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { type CopyPlan, executeCopy } from "./copyGolden.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { emitPackageManagerArtifacts, installCommand } from "./packageManagers.ts"
import { runCommand } from "./runCommand.ts"
import { stampManualDb } from "./stampManualDb.ts"

export type MaterializeInput = {
  readonly options: CreateOptions
  readonly cwd: string
  readonly plan: CopyPlan
  readonly phases: ReadonlyArray<string>
}

const withPhase = <S extends { readonly phases: ReadonlyArray<string> }>(
  state: S,
  phase: string
): S => ({ ...state, phases: [...state.phases, phase] })

const copy = (state: MaterializeInput) => executeCopy(state.plan).pipe(Effect.as(withPhase(state, "copy")))

const maybeStampManualDb = (state: MaterializeInput) =>
  state.options.manualDb
    ? stampManualDb(state.plan.targetDir).pipe(Effect.as(withPhase(state, "stamp-manual-db")))
    : Effect.succeed(state)

const packageManagerArtifacts = (state: MaterializeInput) =>
  emitPackageManagerArtifacts(state.plan.targetDir, state.options.packageManager).pipe(
    Effect.as(withPhase(state, "package-manager-artifacts"))
  )

const logCopied = (state: MaterializeInput) =>
  state.options.verbose
    ? Effect.succeed(state)
    : Console.log(`Copied ${state.plan.files.length} files.`).pipe(Effect.as(state))

const maybeGit = (state: MaterializeInput) =>
  state.options.git
    ? runCommand("git", ["init"], {
      cwd: state.plan.targetDir,
      quiet: state.options.verbose
    }).pipe(Effect.as(withPhase(state, "git-init")))
    : Effect.succeed(state)

const maybeInstall = (state: MaterializeInput) => {
  if (!state.options.install) {
    return Effect.succeed(state)
  }
  const { command, args } = installCommand(state.options.packageManager)
  return runCommand(command, args, {
    cwd: state.plan.targetDir,
    quiet: state.options.verbose
  }).pipe(Effect.as(withPhase(state, "install")))
}

const maybeOpen = (state: MaterializeInput) => {
  if (state.options.open === undefined || state.options.open.length === 0) {
    return Effect.succeed(state)
  }
  return runCommand(state.options.open, [state.plan.targetDir], {
    cwd: state.cwd,
    quiet: state.options.verbose
  }).pipe(Effect.as(withPhase(state, "open")))
}

/** Write the planned tree and run optional post-copy side effects; preserves input shape. */
export const materializeProject = <S extends MaterializeInput>(input: S) =>
  Effect.succeed(input as MaterializeInput).pipe(
    Effect.flatMap(copy),
    Effect.flatMap(maybeStampManualDb),
    Effect.flatMap(packageManagerArtifacts),
    Effect.flatMap(logCopied),
    Effect.flatMap(maybeGit),
    Effect.flatMap(maybeInstall),
    Effect.flatMap(maybeOpen),
    Effect.map((state) => state as S),
    Effect.withSpan("materializeProject")
  )

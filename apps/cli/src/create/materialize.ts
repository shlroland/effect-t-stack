import type { VirtualFileTree } from "@effect-t-stack/template-generator"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { CreateError } from "../shared/CreateError.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { loadWriter } from "./loadGenerator.ts"
import { emitPackageManagerArtifacts, installCommand } from "./packageManagers.ts"
import { runCommand } from "./runCommand.ts"
import { stampManualDb } from "./stampManualDb.ts"

export type MaterializeInput = {
  readonly options: CreateOptions
  readonly cwd: string
  readonly targetDir: string
  readonly scope: string
  readonly tree: VirtualFileTree
  readonly reproducibleCommand: string
  readonly phases: ReadonlyArray<string>
}

const withPhase = <S extends { readonly phases: ReadonlyArray<string> }>(
  state: S,
  phase: string
): S => ({ ...state, phases: [...state.phases, phase] })

const write = (state: MaterializeInput) =>
  Effect.tryPromise({
    try: async () => {
      const writer = await loadWriter()
      await writer.writeTree(state.tree, state.targetDir)
    },
    catch: (cause) =>
      new CreateError({
        message: `Failed to write project: ${cause instanceof Error ? cause.message : String(cause)}`
      })
  }).pipe(Effect.as(withPhase(state, "write")))

const maybeStampManualDb = (state: MaterializeInput) =>
  state.options.manualDb
    ? stampManualDb(state.targetDir).pipe(Effect.as(withPhase(state, "stamp-manual-db")))
    : Effect.succeed(state)

const packageManagerArtifacts = (state: MaterializeInput) =>
  emitPackageManagerArtifacts(state.targetDir, state.options.packageManager).pipe(
    Effect.as(withPhase(state, "package-manager-artifacts"))
  )

const logWrote = (state: MaterializeInput) =>
  state.options.verbose
    ? Effect.succeed(state)
    : Console.log(`Wrote ${state.tree.fileCount} files.`).pipe(Effect.as(state))

const maybeGit = (state: MaterializeInput) =>
  state.options.git
    ? runCommand("git", ["init"], {
      cwd: state.targetDir,
      quiet: state.options.verbose
    }).pipe(Effect.as(withPhase(state, "git-init")))
    : Effect.succeed(state)

const maybeInstall = (state: MaterializeInput) => {
  if (!state.options.install) {
    return Effect.succeed(state)
  }
  const { command, args } = installCommand(state.options.packageManager)
  return runCommand(command, args, {
    cwd: state.targetDir,
    quiet: state.options.verbose
  }).pipe(Effect.as(withPhase(state, "install")))
}

const maybeOpen = (state: MaterializeInput) => {
  if (state.options.open === undefined || state.options.open.length === 0) {
    return Effect.succeed(state)
  }
  return runCommand(state.options.open, [state.targetDir], {
    cwd: state.cwd,
    quiet: state.options.verbose
  }).pipe(Effect.as(withPhase(state, "open")))
}

/** Write the generated tree and run optional post-write side effects. */
export const materializeProject = <S extends MaterializeInput>(input: S) =>
  Effect.succeed(input as MaterializeInput).pipe(
    Effect.flatMap(write),
    Effect.flatMap(maybeStampManualDb),
    Effect.flatMap(packageManagerArtifacts),
    Effect.flatMap(logWrote),
    Effect.flatMap(maybeGit),
    Effect.flatMap(maybeInstall),
    Effect.flatMap(maybeOpen),
    Effect.map((state) => state as S),
    Effect.withSpan("materializeProject")
  )

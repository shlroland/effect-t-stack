import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import { ChildProcess } from "effect/process"
import { ChildProcessSpawner } from "effect/process/ChildProcessSpawner"
import { executeCopy, planCopy, resolveTargetDirectory } from "./copyGolden.ts"
import { CreateError } from "./CreateError.ts"
import { resolveGoldenRoot } from "./paths.ts"
import { toPackageScope } from "./projectName.ts"
import { buildRenameMap } from "./rename.ts"

export type CreateOptions = {
  readonly projectName: string
  readonly yes: boolean
  readonly install: boolean
  readonly git: boolean
  readonly dryRun: boolean
  readonly directoryConflict: "error" | "overwrite" | "increment"
  readonly cwd?: string
  readonly goldenRoot?: string
}

export type CreateResult = {
  readonly targetDir: string
  readonly scope: string
  readonly fileCount: number
  readonly dryRun: boolean
}

export const createProject = Effect.fn("createProject")(function*(options: CreateOptions) {
  if (!options.yes && !options.dryRun) {
    return yield* new CreateError({
      message: "L1 thin MVP requires --yes (or --dry-run). Interactive prompts land later."
    })
  }

  const fs = yield* FileSystem.FileSystem
  const cwd = options.cwd ?? process.cwd()
  const goldenRoot = options.goldenRoot ?? resolveGoldenRoot()
  const goldenOk = yield* fs.exists(goldenRoot)
  if (!goldenOk) {
    return yield* new CreateError({ message: `Golden Sample not found at ${goldenRoot}` })
  }

  const scope = yield* Effect.try({
    try: () => toPackageScope(options.projectName),
    catch: (cause) =>
      new CreateError({
        message: cause instanceof Error ? cause.message : String(cause)
      })
  })

  const targetDir = yield* resolveTargetDirectory(cwd, scope, options.directoryConflict)
  const plan = yield* planCopy(goldenRoot, targetDir, scope)
  const renameMap = buildRenameMap(scope)

  yield* Console.log(`Golden:  ${goldenRoot}`)
  yield* Console.log(`Target:  ${targetDir}`)
  yield* Console.log(`Scope:   @${scope}`)
  yield* Console.log(`Files:   ${plan.files.length}`)
  yield* Console.log(`Rename:  ${renameMap.map(([from, to]) => `${from}→${to}`).join(", ")}`)

  if (options.dryRun) {
    yield* Console.log("Dry run — no writes.")
    return {
      targetDir,
      scope,
      fileCount: plan.files.length,
      dryRun: true
    } satisfies CreateResult
  }

  yield* executeCopy(plan)
  yield* Console.log(`Copied ${plan.files.length} files.`)

  if (options.git) {
    yield* runExternal("git", ["init"], targetDir)
  }
  if (options.install) {
    yield* runExternal("bun", ["install"], targetDir)
  }

  yield* Console.log(`Done. Next: cd ${targetDir} && bun run dev`)
  return {
    targetDir,
    scope,
    fileCount: plan.files.length,
    dryRun: false
  } satisfies CreateResult
})

const runExternal = Effect.fnUntraced(function*(
  command: string,
  args: ReadonlyArray<string>,
  cwd: string
) {
  yield* Console.log(`$ ${command} ${args.join(" ")}`)
  const spawner = yield* ChildProcessSpawner
  const code = yield* spawner.exitCode(
    ChildProcess.make(command, args, {
      cwd,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit"
    })
  )
  if (code !== 0) {
    return yield* new CreateError({ message: `${command} exited with code ${code}` })
  }
})

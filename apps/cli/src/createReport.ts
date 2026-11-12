import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import type { CreateOptions } from "./CreateOptions.ts"
import type { CreateResult } from "./CreateResult.ts"
import { formatVerbose, makeCreateResult } from "./CreateResult.ts"
import { buildRenameMap } from "./rename.ts"

const TITLE = `
┌─────────────────────────────────────┐
│     create-effect-t-stack           │
│     Effect v4 · Golden Sample       │
└─────────────────────────────────────┘
`

export const printTitle = (options: CreateOptions): Effect.Effect<void> =>
  options.renderTitle ? Console.log(TITLE.trim()) : Effect.void

export const printPlanSummary = (input: {
  readonly options: CreateOptions
  readonly goldenRoot: string
  readonly targetDir: string
  readonly scope: string
  readonly fileCount: number
}): Effect.Effect<void> => {
  if (input.options.verbose) {
    return Effect.void
  }
  const rename = buildRenameMap(input.scope)
    .map(([from, to]) => `${from}→${to}`)
    .join(", ")
  return Effect.gen(function*() {
    yield* Console.log(`Golden:  ${input.goldenRoot}`)
    yield* Console.log(`Target:  ${input.targetDir}`)
    yield* Console.log(`Scope:   @${input.scope}`)
    yield* Console.log(`Files:   ${input.fileCount}`)
    yield* Console.log(`Rename:  ${rename}`)
    yield* Console.log(`PM:      ${input.options.packageManager}`)
  })
}

export const emitResult = (
  options: CreateOptions,
  result: CreateResult,
  humanMessage: string
): Effect.Effect<void> => options.verbose ? Console.log(formatVerbose(result)) : Console.log(humanMessage)

export const buildResult = (input: {
  readonly options: CreateOptions
  readonly targetDir: string
  readonly scope: string
  readonly fileCount: number
  readonly dryRun: boolean
  readonly phases: ReadonlyArray<string>
}): CreateResult =>
  makeCreateResult({
    targetDir: input.targetDir,
    scope: input.scope,
    fileCount: input.fileCount,
    dryRun: input.dryRun,
    options: input.options,
    phases: input.phases
  })

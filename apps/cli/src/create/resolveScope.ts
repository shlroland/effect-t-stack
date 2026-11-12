import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import { CreateError } from "../shared/CreateError.ts"
import { resolveGoldenRoot } from "../template/paths.ts"
import { toPackageScope } from "../template/projectName.ts"
import type { CreateOptions } from "./CreateOptions.ts"

export type ResolvedCreateContext = {
  readonly cwd: string
  readonly goldenRoot: string
  readonly scope: string
}

export const resolveCreateContext = Effect.fn("resolveCreateContext")(function*(
  options: CreateOptions
) {
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
  return { cwd, goldenRoot, scope } satisfies ResolvedCreateContext
})

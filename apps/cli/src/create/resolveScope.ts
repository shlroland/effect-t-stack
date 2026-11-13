import * as Effect from "effect/Effect"
import { CreateError } from "../shared/CreateError.ts"
import { toPackageScope } from "../template/projectName.ts"
import type { CreateOptions } from "./CreateOptions.ts"

export type ResolvedCreateContext = {
  readonly cwd: string
  readonly scope: string
}

export const resolveCreateContext = Effect.fn("resolveCreateContext")(function*(
  options: CreateOptions
) {
  const cwd = options.cwd ?? process.cwd()
  const scope = yield* Effect.try({
    try: () => toPackageScope(options.projectName),
    catch: (cause) =>
      new CreateError({
        message: cause instanceof Error ? cause.message : String(cause)
      })
  })
  return { cwd, scope } satisfies ResolvedCreateContext
})

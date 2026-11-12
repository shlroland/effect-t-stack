import * as Effect from "effect/Effect"
import { confirmCreate } from "./confirmCreate.ts"
import { planCopy, resolveTargetDirectory } from "./copyGolden.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { effectiveDirectoryConflict } from "./CreateOptions.ts"
import { buildResult, emitResult, printPlanSummary, printTitle } from "./createReport.ts"
import { materializeProject } from "./materialize.ts"
import { resolveCreateContext } from "./resolveScope.ts"
import { validateCreateOptions } from "./validateCreate.ts"

export type { CreateOptions, DirectoryConflict } from "./CreateOptions.ts"
export type { CreateResult } from "./CreateResult.ts"

/**
 * Create a project by whole-tree copying the Golden Sample.
 *
 * Pipeline: title → validate → resolve → confirm → plan → dry-run | materialize → report
 */
export const createProject = Effect.fn("createProject")(function*(options: CreateOptions) {
  const phases: Array<string> = []

  yield* printTitle(options)
  yield* validateCreateOptions(options)

  const { cwd, goldenRoot, scope } = yield* resolveCreateContext(options)
  yield* confirmCreate(options, scope)

  phases.push("resolve-target")
  const targetDir = yield* resolveTargetDirectory(
    cwd,
    scope,
    effectiveDirectoryConflict(options)
  )

  phases.push("plan-copy")
  const plan = yield* planCopy(goldenRoot, targetDir, scope)
  yield* printPlanSummary({
    options,
    goldenRoot,
    targetDir,
    scope,
    fileCount: plan.files.length
  })

  if (options.dryRun) {
    phases.push("dry-run")
    const result = buildResult({
      options,
      targetDir,
      scope,
      fileCount: plan.files.length,
      dryRun: true,
      phases
    })
    yield* emitResult(options, result, "Dry run — no writes.")
    return result
  }

  yield* materializeProject({ options, cwd, plan, phases })

  const result = buildResult({
    options,
    targetDir,
    scope,
    fileCount: plan.files.length,
    dryRun: false,
    phases
  })
  yield* emitResult(options, result, `Done. Next: cd ${targetDir} && bun run dev`)
  return result
})

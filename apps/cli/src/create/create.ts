import * as Effect from "effect/Effect"
import { validateCreateOptions } from "../compatibility/index.ts"
import { appendHistory } from "../fingerprint/history.ts"
import { confirmCreate } from "./confirmCreate.ts"
import { type CopyPlan, planCopy, resolveTargetDirectory } from "./copyGolden.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { effectiveDirectoryConflict } from "./CreateOptions.ts"
import { buildResult, emitResult, printPlanSummary, printTitle } from "./createReport.ts"
import { materializeProject } from "./materialize.ts"
import { resolveCreateContext } from "./resolveScope.ts"

export type { CreateOptions, DirectoryConflict } from "./CreateOptions.ts"
export type { CreateResult } from "./CreateResult.ts"

type CreatePrepared = {
  readonly options: CreateOptions
  readonly phases: ReadonlyArray<string>
  readonly cwd: string
  readonly goldenRoot: string
  readonly scope: string
}

type CreatePlanned = CreatePrepared & {
  readonly targetDir: string
  readonly plan: CopyPlan
}

const prepare = (options: CreateOptions) =>
  printTitle(options).pipe(
    Effect.andThen(validateCreateOptions(options)),
    Effect.andThen(resolveCreateContext(options)),
    Effect.tap((ctx) => confirmCreate(options, ctx.scope)),
    Effect.map((ctx): CreatePrepared => ({
      options,
      phases: [],
      cwd: ctx.cwd,
      goldenRoot: ctx.goldenRoot,
      scope: ctx.scope
    }))
  )

const planProject = (prepared: CreatePrepared) =>
  resolveTargetDirectory(
    prepared.cwd,
    prepared.scope,
    effectiveDirectoryConflict(prepared.options)
  ).pipe(
    Effect.map((targetDir) => ({
      ...prepared,
      phases: [...prepared.phases, "resolve-target"],
      targetDir
    })),
    Effect.flatMap((state) => {
      const reproducibleCommand = [
        "create-effect-t-stack",
        "create",
        state.scope,
        state.options.yes || state.options.yolo ? "--yes" : undefined,
        state.options.packageManager !== "bun"
          ? `--package-manager ${state.options.packageManager}`
          : undefined,
        state.options.manualDb ? "--manual-db" : undefined,
        state.options.api !== "rpc" ? `--api ${state.options.api}` : undefined,
        !state.options.effectStyle ? "--no-effect-style" : undefined
      ].filter((part): part is string => part !== undefined).join(" ")

      return planCopy(state.goldenRoot, state.targetDir, state.scope, {
        packageManager: state.options.packageManager,
        reproducibleCommand,
        manualDb: state.options.manualDb
      }).pipe(
        Effect.map((plan): CreatePlanned => ({
          ...state,
          phases: [...state.phases, "plan-copy"],
          plan
        }))
      )
    }),
    Effect.tap((state) =>
      printPlanSummary({
        options: state.options,
        goldenRoot: state.goldenRoot,
        targetDir: state.targetDir,
        scope: state.scope,
        fileCount: state.plan.files.length
      })
    )
  )

const report = (
  state: CreatePlanned,
  phases: ReadonlyArray<string>,
  dryRun: boolean,
  humanMessage: string
) => {
  const result = buildResult({
    options: state.options,
    targetDir: state.targetDir,
    scope: state.scope,
    fileCount: state.plan.files.length,
    dryRun,
    phases
  })
  return emitResult(state.options, result, humanMessage).pipe(Effect.as(result))
}

const finishDryRun = (state: CreatePlanned) =>
  report(state, [...state.phases, "dry-run"], true, "Dry run — no writes.")

const finishWrite = (state: CreatePlanned) =>
  materializeProject(state).pipe(
    Effect.tap((written) =>
      appendHistory({
        at: new Date().toISOString(),
        command: written.plan.reproducibleCommand,
        projectDir: written.targetDir,
        scope: written.scope
      })
    ),
    Effect.flatMap((written) =>
      report(
        written,
        written.phases,
        false,
        `Done. Next: cd ${written.targetDir} && bun run dev`
      )
    )
  )

const finish = (state: CreatePlanned) =>
  state.options.dryRun ? finishDryRun(state) : finishWrite(state)

/**
 * Create a project by whole-tree copying the Golden Sample.
 *
 * Pipeline: prepare → plan → dry-run | materialize → report
 */
export const createProject = (options: CreateOptions) =>
  prepare(options).pipe(
    Effect.flatMap(planProject),
    Effect.flatMap(finish),
    Effect.withSpan("createProject")
  )

import type { VirtualFileTree } from "@effect-t-stack/template-generator"
import * as Effect from "effect/Effect"
import { validateCreateOptions } from "../compatibility/index.ts"
import { CLI_VERSION } from "../fingerprint/cliVersion.ts"
import { appendHistory } from "../fingerprint/history.ts"
import { CreateError } from "../shared/CreateError.ts"
import { confirmCreate } from "./confirmCreate.ts"
import { resolveTargetDirectory } from "./targetDirectory.ts"
import type { CreateOptions } from "./CreateOptions.ts"
import { effectiveDirectoryConflict } from "./CreateOptions.ts"
import { buildResult, emitResult, printPlanSummary, printTitle } from "./createReport.ts"
import { loadGenerator } from "./loadGenerator.ts"
import { materializeProject } from "./materialize.ts"
import { resolveCreateContext } from "./resolveScope.ts"

export type { CreateOptions, DirectoryConflict } from "./CreateOptions.ts"
export type { CreateResult } from "./CreateResult.ts"

type CreatePrepared = {
  readonly options: CreateOptions
  readonly phases: ReadonlyArray<string>
  readonly cwd: string
  readonly scope: string
}

type CreatePlanned = CreatePrepared & {
  readonly targetDir: string
  readonly tree: VirtualFileTree
  readonly reproducibleCommand: string
}

const reproducibleCommandFor = (scope: string, options: CreateOptions): string =>
  [
    "create-effect-t-stack",
    "create",
    scope,
    options.yes || options.yolo ? "--yes" : undefined,
    options.packageManager !== "bun" ? `--package-manager ${options.packageManager}` : undefined,
    options.manualDb ? "--manual-db" : undefined,
    options.api !== "rpc" ? `--api ${options.api}` : undefined,
    !options.effectStyle ? "--no-effect-style" : undefined
  ].filter((part): part is string => part !== undefined).join(" ")

const prepare = (options: CreateOptions) =>
  printTitle(options).pipe(
    Effect.andThen(validateCreateOptions(options)),
    Effect.andThen(resolveCreateContext(options)),
    Effect.tap((ctx) => confirmCreate(options, ctx.scope)),
    Effect.map((ctx): CreatePrepared => ({
      options,
      phases: [],
      cwd: ctx.cwd,
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
    Effect.flatMap((state) =>
      Effect.tryPromise({
        try: () => loadGenerator(),
        catch: (cause) =>
          new CreateError({
            message: cause instanceof Error ? cause.message : String(cause)
          })
      }).pipe(
        Effect.flatMap((generator) => {
          const generated = generator.generate({
            config: generator.projectConfig(state.scope, {
              packageManager: state.options.packageManager
            }),
            templates: generator.EMBEDDED_TEMPLATES,
            version: CLI_VERSION
          })
          if (generated._tag === "Failure") {
            return Effect.fail(
              new CreateError({
                message: `${generated.error.phase}: ${generated.error.message}`
              })
            )
          }
          const next: CreatePlanned = {
            ...state,
            phases: [...state.phases, "generate"],
            tree: generated.value,
            reproducibleCommand: reproducibleCommandFor(state.scope, state.options)
          }
          return Effect.succeed(next)
        })
      )
    ),
    Effect.tap((state) =>
      printPlanSummary({
        options: state.options,
        targetDir: state.targetDir,
        scope: state.scope,
        fileCount: state.tree.fileCount
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
    fileCount: state.tree.fileCount,
    dryRun,
    phases
  })
  return emitResult(state.options, result, humanMessage).pipe(Effect.as(result))
}

const finishDryRun = (state: CreatePlanned) => report(state, [...state.phases, "dry-run"], true, "Dry run — no writes.")

const finishWrite = (state: CreatePlanned) =>
  materializeProject(state).pipe(
    Effect.tap((written) =>
      appendHistory({
        at: new Date().toISOString(),
        command: written.reproducibleCommand,
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

const finish = (state: CreatePlanned) => state.options.dryRun ? finishDryRun(state) : finishWrite(state)

/**
 * Create a project from `packages/template-generator` (embedded templates).
 *
 * Pipeline: prepare → generate → dry-run | write → report
 */
export const createProject = (options: CreateOptions) =>
  prepare(options).pipe(
    Effect.flatMap(planProject),
    Effect.flatMap(finish),
    Effect.withSpan("createProject")
  )

import type { ApiPrimary, CreateOptions, Database } from "./CreateOptions.ts"
import type { PackageManager } from "./packageManagers.ts"

export type { DirectoryConflict } from "./CreateOptions.ts"

export type CreateResult = {
  readonly ok: true
  readonly targetDir: string
  readonly scope: string
  readonly fileCount: number
  readonly dryRun: boolean
  readonly packageManager: PackageManager
  readonly api: ApiPrimary
  readonly database: Database
  readonly effectStyle: boolean
  readonly phases: ReadonlyArray<string>
}

export const makeCreateResult = (input: {
  readonly targetDir: string
  readonly scope: string
  readonly fileCount: number
  readonly dryRun: boolean
  readonly options: CreateOptions
  readonly phases: ReadonlyArray<string>
}): CreateResult => ({
  ok: true,
  targetDir: input.targetDir,
  scope: input.scope,
  fileCount: input.fileCount,
  dryRun: input.dryRun,
  packageManager: input.options.packageManager,
  api: input.options.api,
  database: input.options.database,
  effectStyle: input.options.effectStyle,
  phases: input.phases
})

export const formatVerbose = (result: CreateResult): string => JSON.stringify(result, null, 2)

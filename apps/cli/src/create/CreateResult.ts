import type { ApiPrimary, Auth, CreateOptions, Database, TemplateId } from "./CreateOptions.ts"
import type { PackageManager } from "./packageManagers.ts"

export type { DirectoryConflict } from "./CreateOptions.ts"

export type CreateResult = {
  readonly ok: true
  readonly targetDir: string
  readonly scope: string
  readonly fileCount: number
  readonly dryRun: boolean
  readonly packageManager: PackageManager
  readonly template: TemplateId
  readonly api: ApiPrimary
  readonly database: Database
  readonly auth: Auth
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
  template: input.options.template,
  api: input.options.api,
  database: input.options.database,
  auth: input.options.auth,
  effectStyle: input.options.effectStyle,
  phases: input.phases
})

export const formatVerbose = (result: CreateResult): string => JSON.stringify(result, null, 2)

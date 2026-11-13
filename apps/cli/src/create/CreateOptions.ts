import type { PackageManager } from "./packageManagers.ts"

export type DirectoryConflict = "error" | "overwrite" | "increment" | "merge"

export type ApiPrimary = "rpc" | "httpapi"

export type CreateOptions = {
  readonly projectName: string
  readonly yes: boolean
  readonly yolo: boolean
  readonly install: boolean
  readonly git: boolean
  readonly dryRun: boolean
  readonly verbose: boolean
  readonly renderTitle: boolean
  readonly open: string | undefined
  readonly manualDb: boolean
  readonly directoryConflict: DirectoryConflict
  readonly packageManager: PackageManager
  readonly api: ApiPrimary
  readonly effectStyle: boolean
  readonly cwd?: string
}

/** `--yolo` upgrades `error` → `overwrite`. */
export const effectiveDirectoryConflict = (options: CreateOptions): DirectoryConflict =>
  options.yolo && options.directoryConflict === "error" ? "overwrite" : options.directoryConflict

export const skipsConfirmation = (options: CreateOptions): boolean => options.yes || options.yolo || options.dryRun

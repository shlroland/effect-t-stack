export type Runtime = "bun" | "node" | "workers" | "none"

export type ApiPrimary = "rpc" | "httpapi"

export type Database = "sqlite" | "postgres" | "mysql" | "mongodb" | "none"

export type Orm = "drizzle" | "prisma" | "mongoose" | "none"

export type Auth = "none" | "better-auth" | "clerk"

export type FrontendId =
  | "tanstack-start"
  | "tanstack-router"
  | "react-router"
  | "next"
  | "none"

export type Backend = "self" | "server" | "none"

export type PackageManager = "bun" | "npm" | "pnpm"

export type DbSetup = "none"

export type DeployTarget = "none"

export type ProjectConfig = {
  readonly projectName: string
  readonly runtime: Runtime
  readonly api: ApiPrimary
  readonly database: Database
  readonly orm: Orm
  readonly auth: Auth
  readonly frontend: ReadonlyArray<FrontendId>
  readonly backend: Backend
  readonly packageManager: PackageManager
  readonly dbSetup: DbSetup
  readonly webDeploy: DeployTarget
  readonly serverDeploy: DeployTarget
  readonly addons: ReadonlyArray<string>
  readonly examples: ReadonlyArray<string>
}

export type GeneratorPhase =
  | "initialization"
  | "templates"
  | "package-configs"
  | "dependencies"
  | "env"
  | "catalogs"
  | "readme"
  | "fingerprint"

export class GeneratorError extends Error {
  readonly _tag = "GeneratorError"

  constructor(
    readonly phase: GeneratorPhase,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = "GeneratorError"
  }
}

export type VirtualFileNode = {
  readonly type: "file"
  readonly name: string
  readonly content: string
  readonly sourcePath?: string
}

export type VirtualDirNode = {
  readonly type: "directory"
  readonly name: string
  readonly children: ReadonlyArray<VirtualNode>
}

export type VirtualNode = VirtualFileNode | VirtualDirNode

export type VirtualFileTree = {
  readonly root: VirtualDirNode
  readonly fileCount: number
  readonly directoryCount: number
  readonly config: ProjectConfig
}

export type GenerateOptions = {
  readonly config: ProjectConfig
  readonly templates: ReadonlyMap<string, string>
  /** CLI release. When set, `generate` writes `ets.jsonc` (stack fields + create-time meta). */
  readonly version?: string
}

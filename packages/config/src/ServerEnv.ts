import { Config, ConfigProvider, Effect, Schema } from "effect"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

export const ServerEnvDefaults = {
  DATABASE_URL: "./data.db",
  PORT: 3737
} as const

export const ServerEnvFields = {
  DATABASE_URL: Schema.NonEmptyString,
  PORT: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 65535 }))
} as const

/**
 * Shared server env schema (SCREAMING_SNAKE keys).
 * Source of truth for both Effect `Config` and sync tooling loaders.
 */
export const ServerEnv = Schema.Struct({
  DATABASE_URL: ServerEnvFields.DATABASE_URL,
  PORT: ServerEnvFields.PORT
})
export type ServerEnv = typeof ServerEnv.Type

/**
 * Runtime config shape used by `AppConfig` (camelCase).
 * Priority comes from the fiber `ConfigProvider` (see {@link makeServerEnvProvider}).
 */
export const serverEnvConfig = Config.all({
  databaseUrl: Config.schema(ServerEnvFields.DATABASE_URL, "DATABASE_URL").pipe(
    Config.withDefault(ServerEnvDefaults.DATABASE_URL)
  ),
  port: Config.Port("PORT").pipe(
    Config.withDefault(ServerEnvDefaults.PORT)
  )
})

export type MakeServerEnvProviderOptions = {
  /** `.env` path; default `".env"` (cwd). Pass `false` to skip file fallback. */
  readonly envFile?: string | URL | false
  /** Override process env (tests). When omitted, reads `process.env` / `import.meta.env`. */
  readonly env?: Record<string, string | undefined>
}

const resolveEnvFilePath = (envFile: string | URL): string =>
  typeof envFile === "string" ? envFile : fileURLToPath(envFile)

const readDotEnvProvider = (envFile: string | URL): ConfigProvider.ConfigProvider => {
  try {
    return ConfigProvider.fromDotEnvContents(
      readFileSync(resolveEnvFilePath(envFile), "utf8")
    )
  } catch {
    return ConfigProvider.fromUnknown({})
  }
}

/**
 * Process env wins; optional `.env` fills gaps; `Config.withDefault` covers the rest.
 *
 * Uses sync `fromDotEnvContents` (not async `fromDotEnv`) so drizzle-kit / Node
 * tooling can `Effect.runSync` without a FileSystem Layer.
 */
export const makeServerEnvProvider = (
  options?: MakeServerEnvProviderOptions
): ConfigProvider.ConfigProvider => {
  const fromProcess = options?.env !== undefined
    ? ConfigProvider.fromEnvRecord(options.env)
    : ConfigProvider.fromEnv()

  if (options?.envFile === false) {
    return fromProcess
  }

  return ConfigProvider.orElse(
    fromProcess,
    readDotEnvProvider(options?.envFile ?? ".env")
  )
}

/** Install {@link makeServerEnvProvider} as the fiber ConfigProvider. */
export const layer = (options?: MakeServerEnvProviderOptions) => ConfigProvider.layer(makeServerEnvProvider(options))

/**
 * Sync loader for tooling (`drizzle.config.ts`, scripts).
 * Returns Schema keys (`DATABASE_URL`, `PORT`).
 */
export const loadServerEnv = (
  options?: MakeServerEnvProviderOptions
): ServerEnv => {
  const { databaseUrl, port } = Effect.runSync(
    serverEnvConfig.parse(makeServerEnvProvider(options))
  )
  return {
    DATABASE_URL: databaseUrl,
    PORT: port
  }
}

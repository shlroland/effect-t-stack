import type { VirtualFileSystem } from "./core/virtual-fs.ts"
import type { ProjectConfig } from "./types.ts"
import { reproducibleCommand } from "./utils/reproducible-command.ts"

export const ETS_SCHEMA_URL =
  "https://raw.githubusercontent.com/shlroland/effect-t-stack/main/apps/cli/schemas/ets.schema.json"

export const FINGERPRINT_SCHEMA_VERSION = 1

const pkg = (config: ProjectConfig, name: string): string => `@${config.projectName}/${name}`

/**
 * Fingerprint written in code (not a template), same role as Better-T-Stack's `bts.jsonc`.
 * Written only when `generate` is given a CLI `version`. Stack fields mirror the Golden Sample;
 * create-time meta (`$schema`, `createdAt`, `cliVersion`, `reproducibleCommand`) is stamped here.
 */
export const writeEtsConfig = (vfs: VirtualFileSystem, config: ProjectConfig, version: string): void => {
  const frontend = config.frontend[0] ?? "tanstack-start"
  const body = {
    version: FINGERPRINT_SCHEMA_VERSION,
    name: config.projectName,
    effect: "v4",
    runtime: config.runtime,
    api: config.api,
    apiOptions: {
      prefix: "/rpc",
      import: `${pkg(config, "protocol")}/rpc`,
      client: `${pkg(config, "client")}/rpc`,
      group: "AppRpcs",
      modules: ["Rpc", "RpcGroup", "RpcServer", "RpcClient", "RpcSerialization"],
      serialization: "ndjson",
      protocol: "http",
      secondary: {
        api: "httpapi",
        prefix: "/api",
        import: `${pkg(config, "protocol")}/http-api`,
        client: `${pkg(config, "client")}/http-api`,
        modules: ["HttpApi", "HttpApiBuilder", "HttpApiClient"],
        note: "Same Services; OpenAPI/docs; separate protocol/client/server folders from Rpc."
      }
    },
    database: config.database,
    orm: config.orm,
    ormOptions: {
      package: "drizzle-orm",
      version: "catalog:",
      kit: "drizzle-kit",
      effectDriver: "drizzle-orm/effect-sqlite-bun",
      sqlClient: "@effect/sql-sqlite-bun",
      catalog: "docs/DEPENDENCY-CATALOG.md",
      secondary: {
        orm: "effect-sql",
        package: "@effect/sql-sqlite-bun",
        modules: ["SqlClient", "SqlSchema", "SqliteMigrator"],
        import: `${pkg(config, "db")}/effect-sql`,
        migrations: "packages/db/effect-sql-migrations",
        note: "Swap Database/Migrations/TodosRepository layers; shared service tag."
      }
    },
    auth: config.auth,
    frontend,
    frontendOptions: {
      atom: {
        package: "@effect/atom-react",
        version: "catalog:",
        client: "rpc",
        modules: ["Atom", "AtomRpc", "AsyncResult", "RegistryProvider", "HydrationBoundary"],
        reactivity: "effect/reactivity",
        ssr: {
          loader: "apps/web/src/routes/index.tsx",
          dehydrate: "apps/web/src/atoms/dehydrateTodos.ts",
          hydrate: "HydrationBoundary",
          serializationKey: "todos list query"
        },
        note:
          "Server remains SoT; Start loader dehydrates AtomRpc ListTodos query; client HydrationBoundary + optimistic mutations; UI filter/draft/edit in local atoms. Future CLI may set atom.client to httpapi when api primary flips."
      },
      peer: { scheduler: "catalog:" },
      catalog: "docs/DEPENDENCY-CATALOG.md"
    },
    backend: config.backend,
    backendOptions: {
      mount: "apps/web/src/server.ts",
      rpcPrefix: "/rpc",
      rpcWebHandler: `${pkg(config, "server")}/createRpcWebHandler`,
      apiPrefix: "/api",
      httpApiWebHandler: `${pkg(config, "server")}/createHttpApiWebHandler`,
      secondary: {
        backend: "httpapi-server",
        app: "apps/server",
        runtime: "bun",
        port: 3737,
        note: "Set VITE_API_URL=http://localhost:3737 for standalone server."
      }
    },
    env: {
      package: pkg(config, "config"),
      module: "ServerEnv",
      provider: ["fromEnv", "fromDotEnvContents"],
      defaults: {
        DATABASE_URL: "./data.db",
        PORT: 3737,
        CORS_ORIGINS: ["http://localhost:5173", "http://127.0.0.1:5173"]
      },
      webEnvFile: "apps/web/.env",
      serverEnvFile: "apps/server/.env",
      note: `Rpc + HttpApi Layers in ${pkg(config, "server")}; ${pkg(config, "config")} owns Schema/Config only.`
    },
    addons: [...config.addons],
    addonOptions: {
      "effect-style": {
        formatter: "dprint",
        dprint: {
          config: "dprint.json",
          alignWith: "Effect repo dprint.json (ASI, double quotes, no trailing commas, lineWidth 120)"
        },
        linter: "oxlint",
        oxlint: {
          config: ".oxlintrc.json",
          paths: ["apps", "packages"],
          plugin: "packages/effect-oxc"
        },
        effectOxc: {
          package: "@effect/oxc",
          published: false,
          ownedCopy: "packages/effect-oxc",
          jsPlugin: "./packages/effect-oxc/src/oxlint/index.ts",
          upstream:
            "https://github.com/Effect-TS/effect/tree/7865dbbb7b6a91691921dbb4febedf3ab94a348b/packages/tools/oxc",
          note:
            "Owned copy until @effect/oxc publishes on npm. Then depend on the official package and delete packages/effect-oxc."
        },
        conflictsWith: ["biome", "ultracite", "oxlint-only", "husky"],
        scripts: ["lint", "lint-fix"],
        checkIncludesLint: true,
        preCommit: { tool: "lefthook", config: "lefthook.yml" },
        ci: { workflow: ".github/workflows/check.yml", command: "bun run check" },
        prepare: "effect-language-service patch && lefthook install",
        catalog: "docs/DEPENDENCY-CATALOG.md"
      },
      skills: {
        scope: "project",
        dir: ".agents/skills",
        lockfile: "skills-lock.json",
        selections: [{ source: "Effect-TS/skills", skills: ["effect-ts", "effect-v3-to-v4"] }],
        rootEffectDevDependency: true,
        agentsMdLearningSection: true
      },
      repos: {
        dir: "repos",
        editorExclude: true,
        selections: [{
          name: "effect",
          prefix: "repos/effect",
          url: "https://github.com/Effect-TS/effect.git",
          ref: "main",
          squash: true,
          readFirst: ["repos/effect/LLMS.md"]
        }]
      },
      "language-service": {
        package: "@effect/language-service",
        typescriptMajor: 6,
        plugin: "@effect/language-service",
        tsconfig: "packages/config/tsconfig.base.json",
        prepare: "effect-language-service patch",
        vscodeUseTsgo: false,
        diagnosticSeverity: { unstableApiUsage: "suggestion" },
        cli: {
          diagnostics: "effect-language-service diagnostics --format json",
          scripts: ["effect:diagnostics", "effect:diagnostics:server", "effect:diagnostics:web"]
        },
        optionalTs7: {
          package: "@effect/tsgo",
          note: "Only when the whole app stack supports TypeScript 7."
        },
        catalog: "docs/DEPENDENCY-CATALOG.md"
      },
      mcp: {
        cursorMcpJson: ".cursor/mcp.json",
        servers: {
          "effect-docs": {
            package: "effect-mcp",
            source: "https://github.com/tim-smart/effect-mcp",
            command: "npx",
            args: ["-y", "effect-mcp@latest"],
            tools: ["effect_docs_search", "get_effect_doc"]
          }
        },
        effectSolutions: {
          enabled: false,
          package: "effect-solutions",
          authority: "secondary",
          cli: "bunx effect-solutions@latest",
          note: "Enable for scenario patterns only; AGENTS.md + repos/effect win on conflict."
        }
      }
    },
    examples: [...config.examples],
    packageManager: config.packageManager
  }

  const stamped = {
    $schema: ETS_SCHEMA_URL,
    ...body,
    createdAt: new Date().toISOString(),
    cliVersion: version,
    reproducibleCommand: reproducibleCommand(config, version)
  }
  const header = "// Fingerprint (generated). Field classes: stack dims · addons[] · addonOptions · meta.\n" +
    "// version = schema version; cliVersion = CLI release.\n"
  vfs.writeFile("ets.jsonc", `${header}${JSON.stringify(stamped, null, 2)}\n`)
}

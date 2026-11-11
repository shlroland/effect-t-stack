import { describe, expect, it } from "bun:test"
import { Effect } from "effect"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadServerEnv, makeServerEnvProvider, serverEnvConfig } from "./ServerEnv.ts"

describe("ServerEnv", () => {
  it("uses defaults when env and file are empty", () => {
    const env = loadServerEnv({ env: {}, envFile: false })
    expect(env).toEqual({
      DATABASE_URL: "./data.db",
      PORT: 3737
    })
  })

  it("prefers process env over .env file", () => {
    const dir = mkdtempSync(join(tmpdir(), "ets-config-"))
    const envFile = join(dir, ".env")
    writeFileSync(envFile, "DATABASE_URL=./from-file.db\nPORT=1111\n")

    const env = loadServerEnv({
      envFile,
      env: {
        DATABASE_URL: "./from-env.db",
        PORT: "2222"
      }
    })

    expect(env).toEqual({
      DATABASE_URL: "./from-env.db",
      PORT: 2222
    })
  })

  it("fills gaps from .env when process env is missing keys", () => {
    const dir = mkdtempSync(join(tmpdir(), "ets-config-"))
    const envFile = join(dir, ".env")
    writeFileSync(envFile, "DATABASE_URL=./from-file.db\nPORT=4444\n")

    const env = loadServerEnv({
      envFile,
      env: {}
    })

    expect(env).toEqual({
      DATABASE_URL: "./from-file.db",
      PORT: 4444
    })
  })

  it("ignores a missing .env file", () => {
    const env = loadServerEnv({
      env: { PORT: "5555" },
      envFile: join(tmpdir(), "ets-config-missing-.env")
    })

    expect(env).toEqual({
      DATABASE_URL: "./data.db",
      PORT: 5555
    })
  })

  it("parses camelCase via serverEnvConfig", () => {
    const values = Effect.runSync(
      serverEnvConfig.parse(
        makeServerEnvProvider({
          env: { DATABASE_URL: "./x.db", PORT: "8080" },
          envFile: false
        })
      )
    )
    expect(values).toEqual({ databaseUrl: "./x.db", port: 8080 })
  })
})

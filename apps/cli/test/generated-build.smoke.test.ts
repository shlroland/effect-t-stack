import * as BunServices from "@effect/platform-bun/BunServices"
import { afterAll, describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createProject } from "../src/create/create.ts"
import type { ApiPrimary, Database } from "../src/create/CreateOptions.ts"

/**
 * Generated-build smoke: materialize a project and typecheck.
 * Skipped unless ETS_GENERATED_BUILD=1 (slow; needs network for bun install).
 */
describe("generated-build smoke", () => {
  const temps: Array<string> = []

  afterAll(async () => {
    await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true, maxRetries: 5 })))
  }, 120_000)

  test("create --yes then bun run check-types", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    await createAndTypecheck(temps, "smoke")
  }, 900_000)

  test("create --yes --api httpapi then bun run check-types", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    const targetDir = await createAndTypecheck(temps, "smoke-httpapi", { api: "httpapi" })
    const todos = await readFile(join(targetDir, "apps/web/src/atoms/todos.ts"), "utf8")
    expect(todos).toContain("HttpApiAtoms")
  }, 900_000)

  test("create --yes --database postgres then bun run check-types", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    const targetDir = await createAndTypecheck(temps, "smoke-pg", { database: "postgres" })
    const schema = await readFile(join(targetDir, "packages/db/src/schema.ts"), "utf8")
    expect(schema).toContain("pgTable")
    const fingerprint = await readFile(join(targetDir, "ets.jsonc"), "utf8")
    expect(fingerprint).toContain("\"database\": \"postgres\"")
  }, 900_000)
})

const createAndTypecheck = async (
  temps: Array<string>,
  projectName: string,
  patch?: { readonly api?: ApiPrimary; readonly database?: Database }
): Promise<string> => {
  const api = patch?.api ?? "rpc"
  const database = patch?.database ?? "sqlite"
  const cwd = await mkdtemp(join(tmpdir(), "ets-gen-"))
  temps.push(cwd)
  const result = await Effect.runPromise(
    createProject({
      projectName,
      yes: true,
      yolo: false,
      dryRun: false,
      install: true,
      git: true,
      verbose: false,
      renderTitle: false,
      open: undefined,
      manualDb: false,
      directoryConflict: "error",
      packageManager: "bun",
      template: "default",
      api,
      database,
      auth: "none",
      effectStyle: true,
      cwd
    }).pipe(Effect.provide(BunServices.layer)) as Effect.Effect<{
      readonly targetDir: string
      readonly scope: string
      readonly fileCount: number
      readonly dryRun: boolean
      readonly api: ApiPrimary
      readonly database: Database
    }, unknown>
  )
  expect(result.api).toBe(api)
  expect(result.database).toBe(database)
  const pkg = JSON.parse(await readFile(join(result.targetDir, "package.json"), "utf8")) as {
    name: string
  }
  expect(pkg.name).toBe(projectName)
  await run("bun", ["run", "check-types"], result.targetDir)
  return result.targetDir
}

const run = (command: string, argv: ReadonlyArray<string>, cwd: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...argv], { cwd, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${argv.join(" ")} => ${code}`))
    })
  })

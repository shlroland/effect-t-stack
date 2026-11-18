import { afterAll, describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { writeTree } from "../src/fs-writer.ts"
import type { ProjectConfig } from "../src/types.ts"
import { generateDefault } from "./support.ts"

/**
 * Generated-build: materialize a stack cell, install, typecheck, and lint.
 * Skipped unless ETS_GENERATED_BUILD=1 (slow; needs a network install).
 */
describe("generated-build", () => {
  const temps: Array<string> = []

  afterAll(async () => {
    await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true, maxRetries: 5 })))
  }, 120_000)

  test("default config installs, typechecks, and lints without repos/", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    await materializeAndCheck(temps, "smoke")
  }, 900_000)

  test("api=httpapi installs, typechecks, and lints AtomHttpApi primary", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    const projectDir = await materializeAndCheck(temps, "smoke-httpapi", { api: "httpapi" })
    const todos = await readFile(join(projectDir, "apps/web/src/atoms/todos.ts"), "utf8")
    expect(todos).toContain("HttpApiAtoms")
    expect(todos.includes("RpcAtoms.query")).toBe(false)
    const fingerprint = await readFile(join(projectDir, "ets.jsonc"), "utf8")
    expect(fingerprint).toContain("\"api\": \"httpapi\"")
  }, 900_000)

  test("database=postgres installs, typechecks, and lints Drizzle pg cell", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    const projectDir = await materializeAndCheck(temps, "smoke-pg", { database: "postgres" })
    const schema = await readFile(join(projectDir, "packages/db/src/schema.ts"), "utf8")
    expect(schema).toContain("pgTable")
    const database = await readFile(join(projectDir, "packages/db/src/Database.ts"), "utf8")
    expect(database).toContain("@effect/sql-pg")
    const fingerprint = await readFile(join(projectDir, "ets.jsonc"), "utf8")
    expect(fingerprint).toContain("\"database\": \"postgres\"")
  }, 900_000)
})

const materializeAndCheck = async (
  temps: Array<string>,
  name: string,
  patch?: Partial<Omit<ProjectConfig, "projectName">>
): Promise<string> => {
  const projectDir = await mkdtemp(join(tmpdir(), "ets-tpl-"))
  temps.push(projectDir)
  const tree = generateDefault(name, patch, "0.1.0")
  await Effect.runPromise(writeTree(tree, projectDir))
  const pkg = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as { name: string }
  expect(pkg.name).toBe(name)
  await run("git", ["init"], projectDir)
  await run("git", ["config", "user.email", "ets@example.com"], projectDir)
  await run("git", ["config", "user.name", "ets"], projectDir)
  await run("bun", ["install"], projectDir)
  await run("bun", ["run", "check-types"], projectDir)
  await run("bun", ["run", "lint"], projectDir)
  return projectDir
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

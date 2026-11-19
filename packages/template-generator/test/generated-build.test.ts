import { afterAll, describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { spawn, spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { writeTree } from "../src/fs-writer.ts"
import type { PackageManager, ProjectConfig } from "../src/types.ts"
import { generateDefault } from "./support.ts"

/**
 * Generated-build: materialize a stack cell, install, typecheck, and lint.
 * Skipped unless ETS_GENERATED_BUILD=1 (slow; needs a network install).
 *
 * npm/pnpm samples prove install-tool fidelity (catalogs, allowScripts/allowBuilds,
 * PM-keyed root scripts). They skip when the binary is missing on PATH.
 * Full `test`/`check` still needs Bun while `runtime=bun`.
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

  test("auth=better-auth installs, typechecks, and lints session-gated surfaces", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    const projectDir = await materializeAndCheck(temps, "smoke-ba", { auth: "better-auth" })
    const todosApi = await readFile(join(projectDir, "packages/protocol/src/http-api/TodosApi.ts"), "utf8")
    expect(todosApi).toContain("AuthHttpMiddleware")
    const httpHandler = await readFile(
      join(projectDir, "apps/server/src/http/createHttpApiWebHandler.ts"),
      "utf8"
    )
    expect(httpHandler).toContain("AuthHttpMiddlewareLive")
    const fingerprint = await readFile(join(projectDir, "ets.jsonc"), "utf8")
    expect(fingerprint).toContain("\"auth\": \"better-auth\"")
  }, 900_000)

  test("packageManager=npm installs, typechecks, and lints", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    if (!hasBinary("npm")) {
      console.warn("skipping packageManager=npm generated-build: npm not on PATH")
      return
    }
    const projectDir = await materializeAndCheck(temps, "smoke-npm", { packageManager: "npm" }, "npm")
    const root = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as {
      allowScripts?: ReadonlyArray<string>
      scripts: Record<string, string>
    }
    expect(root.allowScripts).toEqual(["esbuild", "dprint", "lefthook"])
    expect(root.scripts["check"]).toContain("npm run")
  }, 900_000)

  test("packageManager=pnpm installs, typechecks, and lints", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    if (!hasBinary("pnpm")) {
      console.warn("skipping packageManager=pnpm generated-build: pnpm not on PATH")
      return
    }
    const projectDir = await materializeAndCheck(temps, "smoke-pnpm", { packageManager: "pnpm" }, "pnpm")
    const yaml = await readFile(join(projectDir, "pnpm-workspace.yaml"), "utf8")
    expect(yaml).toContain("allowBuilds:")
    expect(yaml).toContain("\"esbuild\": true")
    const root = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as {
      scripts: Record<string, string>
    }
    expect(root.scripts["check"]).toContain("pnpm run")
  }, 900_000)
})

const hasBinary = (command: string): boolean => {
  // Run outside this repo: pnpm refuses `--version` when package.json pins another PM.
  const result = spawnSync(command, ["--version"], { encoding: "utf8", cwd: tmpdir() })
  return result.status === 0
}

const materializeAndCheck = async (
  temps: Array<string>,
  name: string,
  patch?: Partial<Omit<ProjectConfig, "projectName">>,
  packageManager: PackageManager = "bun"
): Promise<string> => {
  const projectDir = await mkdtemp(join(tmpdir(), "ets-tpl-"))
  temps.push(projectDir)
  const tree = generateDefault(name, patch, "0.1.0")
  await Effect.runPromise(writeTree(tree, projectDir))
  // Mirror CLI `emitPackageManagerArtifacts`: turbo requires a semver packageManager pin.
  await stampPackageManagerPin(projectDir, packageManager)
  const pkg = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as { name: string }
  expect(pkg.name).toBe(name)
  await run("git", ["init"], projectDir)
  await run("git", ["config", "user.email", "ets@example.com"], projectDir)
  await run("git", ["config", "user.name", "ets"], projectDir)
  await run(packageManager, ["install"], projectDir)
  await run(packageManager, ["run", "check-types"], projectDir)
  await run(packageManager, ["run", "lint"], projectDir)
  return projectDir
}

const stampPackageManagerPin = async (projectDir: string, pm: PackageManager): Promise<void> => {
  if (pm === "bun") return
  const detected = spawnSync(pm, ["--version"], { encoding: "utf8", cwd: tmpdir() })
  const version = detected.stdout.trim().replace(/^v/i, "").split(/\s+/)[0]
  if (version === undefined || !/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`could not detect ${pm} version for packageManager pin`)
  }
  const rootPath = join(projectDir, "package.json")
  const pkg = JSON.parse(await readFile(rootPath, "utf8")) as Record<string, unknown>
  pkg["packageManager"] = `${pm}@${version}`
  await writeFile(rootPath, `${JSON.stringify(pkg, null, 2)}\n`)
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

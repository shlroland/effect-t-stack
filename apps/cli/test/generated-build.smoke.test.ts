import * as BunServices from "@effect/platform-bun/BunServices"
import { afterAll, describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createProject } from "../src/create/create.ts"

/**
 * Generated-build smoke: materialize a project and typecheck.
 * Skipped unless ETS_GENERATED_BUILD=1 (slow; needs network for bun install).
 */
describe("generated-build smoke", () => {
  const temps: Array<string> = []

  afterAll(async () => {
    await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  test("create --yes then bun run check-types", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") {
      return
    }
    const cwd = await mkdtemp(join(tmpdir(), "ets-gen-"))
    temps.push(cwd)
    const result = await Effect.runPromise(
      createProject({
        projectName: "smoke",
        yes: true,
        yolo: false,
        dryRun: false,
        install: true,
        git: false,
        verbose: false,
        renderTitle: false,
        open: undefined,
        manualDb: false,
        directoryConflict: "error",
        packageManager: "bun",
        api: "rpc",
        effectStyle: true,
        cwd
      }).pipe(Effect.provide(BunServices.layer)) as Effect.Effect<{
        readonly targetDir: string
        readonly scope: string
        readonly fileCount: number
        readonly dryRun: boolean
      }, unknown>
    )
    const pkg = JSON.parse(await readFile(join(result.targetDir, "package.json"), "utf8")) as {
      name: string
    }
    expect(pkg.name).toBe("smoke")
    await run("bun", ["run", "check-types"], result.targetDir)
  }, 600_000)
})

const run = (command: string, argv: ReadonlyArray<string>, cwd: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...argv], { cwd, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${argv.join(" ")} => ${code}`))
    })
  })

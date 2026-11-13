import { afterAll, describe, expect, test } from "bun:test"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { writeTree } from "../src/fs-writer.ts"
import { generateDefault } from "./support.ts"

/**
 * Generated-build: materialize the default stack, install, typecheck, and lint.
 * Skipped unless ETS_GENERATED_BUILD=1 (slow; needs a network install).
 */
describe("generated-build", () => {
  const temps: Array<string> = []

  afterAll(async () => {
    await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  test("default config installs, typechecks, and lints without repos/", async () => {
    if (process.env["ETS_GENERATED_BUILD"] !== "1") return
    const projectDir = await mkdtemp(join(tmpdir(), "ets-tpl-"))
    temps.push(projectDir)
    const tree = generateDefault("smoke", undefined, "0.1.0")
    await writeTree(tree, projectDir)
    const pkg = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as { name: string }
    expect(pkg.name).toBe("smoke")
    await run("git", ["init"], projectDir)
    await run("git", ["config", "user.email", "ets@example.com"], projectDir)
    await run("git", ["config", "user.name", "ets"], projectDir)
    await run("bun", ["install"], projectDir)
    await run("bun", ["run", "check-types"], projectDir)
    await run("bun", ["run", "lint"], projectDir)
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

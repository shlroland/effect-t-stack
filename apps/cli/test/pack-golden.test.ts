import { afterAll, describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const cliRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..")
const golden = join(cliRoot, "templates/golden")

describe("pack:golden", () => {
  afterAll(async () => {
    await rm(join(cliRoot, "templates"), { recursive: true, force: true })
  })

  test("embeds golden without denied paths", async () => {
    const proc = Bun.spawn(["bun", "run", "scripts/pack-golden.ts"], {
      cwd: cliRoot,
      stdout: "pipe",
      stderr: "pipe"
    })
    const code = await proc.exited
    const stderr = await new Response(proc.stderr).text()
    expect(code).toBe(0)
    expect(stderr).toBe("")

    expect(existsSync(join(golden, "package.json"))).toBe(true)
    expect(existsSync(join(golden, "ets.jsonc"))).toBe(true)
    expect(existsSync(join(golden, "node_modules"))).toBe(false)
    expect(existsSync(join(golden, "repos"))).toBe(false)
    expect(existsSync(join(golden, ".cursor"))).toBe(false)
  }, 60_000)
})

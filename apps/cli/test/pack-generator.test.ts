import { afterAll, describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const cliRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..")
const packed = join(cliRoot, "templates/template-generator")

describe("pack:generator", () => {
  afterAll(async () => {
    await rm(join(cliRoot, "templates"), { recursive: true, force: true })
  })

  test("embeds the template generator, not the golden tree", async () => {
    const proc = Bun.spawn(["bun", "run", "scripts/pack-generator.ts"], {
      cwd: cliRoot,
      stdout: "pipe",
      stderr: "pipe"
    })
    const [code] = await Promise.all([
      proc.exited,
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text()
    ])
    expect(code).toBe(0)
    expect(existsSync(join(packed, "src/index.ts"))).toBe(true)
    expect(existsSync(join(packed, "src/templates.generated.ts"))).toBe(true)
    expect(existsSync(join(packed, "src/fs-writer.ts"))).toBe(true)
    expect(existsSync(join(packed, "node_modules"))).toBe(false)
    expect(existsSync(join(packed, "examples"))).toBe(false)
    expect(existsSync(join(cliRoot, "templates/golden"))).toBe(false)
  }, 60_000)
})

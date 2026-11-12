import * as BunServices from "@effect/platform-bun/BunServices"
import { afterAll, describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { addAddon } from "../src/add/addAddon.ts"
import { addPackage } from "../src/add/addPackage.ts"
import { createProject } from "../src/create/create.ts"
import type { CreateOptions } from "../src/create/CreateOptions.ts"
import { parseFingerprint } from "../src/fingerprint/fingerprint.ts"

const provideBun = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(Effect.provide(BunServices.layer)) as Effect.Effect<A, E>

const base = (overrides: Partial<CreateOptions> & Pick<CreateOptions, "projectName" | "cwd">): CreateOptions => ({
  yes: true,
  yolo: false,
  install: false,
  git: false,
  dryRun: false,
  verbose: false,
  renderTitle: false,
  open: undefined,
  manualDb: false,
  directoryConflict: "error",
  packageManager: "bun",
  api: "rpc",
  effectStyle: true,
  ...overrides
})

describe("add --package", () => {
  const temps: Array<string> = []

  afterAll(async () => {
    await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  test("scaffolds packages/<name> and records fingerprint", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-add-pkg-"))
    temps.push(cwd)
    const created = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "shop", cwd })))
    )
    await Effect.runPromise(
      provideBun(
        addPackage({
          packageName: "billing",
          projectDir: created.targetDir,
          dryRun: false,
          verbose: false
        })
      )
    )
    const pkg = JSON.parse(
      await readFile(join(created.targetDir, "packages/billing/package.json"), "utf8")
    ) as { name: string }
    expect(pkg.name).toBe("@shop/billing")
    const ets = parseFingerprint(await readFile(join(created.targetDir, "ets.jsonc"), "utf8"))
    expect((ets.addonOptions as { packages?: Array<string> } | undefined)?.packages).toContain(
      "billing"
    )
  })
})

describe("add <addon>", () => {
  const temps: Array<string> = []

  afterAll(async () => {
    await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  test("idempotent golden addon", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-add-addon-"))
    temps.push(cwd)
    const created = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "addon-shop", cwd })))
    )
    const result = await Effect.runPromise(
      provideBun(
        addAddon({
          addon: "mcp",
          projectDir: created.targetDir,
          dryRun: false,
          verbose: false
        })
      )
    )
    expect(result.alreadyPresent).toBe(true)
  })

  test("rejects non-golden addon", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-add-bad-"))
    temps.push(cwd)
    const created = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "addon-bad", cwd })))
    )
    const exit = await Effect.runPromise(
      provideBun(
        addAddon({
          addon: "biome",
          projectDir: created.targetDir,
          dryRun: false,
          verbose: false
        })
      ).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("biome")
  })
})

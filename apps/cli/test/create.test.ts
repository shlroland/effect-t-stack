import * as BunServices from "@effect/platform-bun/BunServices"
import { afterAll, describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { resolveTargetDirectory } from "../src/create/copyGolden.ts"
import { createProject } from "../src/create/create.ts"
import type { CreateOptions } from "../src/create/CreateOptions.ts"
import { CreateError } from "../src/shared/CreateError.ts"
import { resolveGoldenRoot } from "../src/template/paths.ts"

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

describe("createProject (Effect)", () => {
  const temps: Array<string> = []

  afterAll(async () => {
    await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  test("dry-run plans copy without writing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-cli-dry-"))
    temps.push(cwd)
    const result = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "demo", cwd, dryRun: true, yes: false })))
    )
    expect(result.dryRun).toBe(true)
    expect(result.fileCount).toBeGreaterThan(10)
    expect(result.scope).toBe("demo")
    await expect(stat(join(cwd, "demo"))).rejects.toThrow()
  })

  test("verbose dry-run returns phases", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-cli-verbose-"))
    temps.push(cwd)
    const result = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "v", cwd, dryRun: true, verbose: true })))
    )
    expect(result.phases).toContain("dry-run")
    expect(result.packageManager).toBe("bun")
  })

  test("conflict error when target exists", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-cli-conflict-"))
    temps.push(cwd)
    await mkdir(join(cwd, "taken"), { recursive: true })
    const exit = await Effect.runPromise(
      provideBun(resolveTargetDirectory(cwd, "taken", "error")).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("CreateError")
  })

  test("copies and renames @ets scope without install", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-cli-copy-"))
    temps.push(cwd)
    const result = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "acme", cwd })))
    )
    expect(result.targetDir).toBe(join(cwd, "acme"))
    const rootPkg = JSON.parse(await readFile(join(result.targetDir, "package.json"), "utf8")) as {
      name: string
    }
    expect(rootPkg.name).toBe("acme")
    const domainPkg = JSON.parse(
      await readFile(join(result.targetDir, "packages/domain/package.json"), "utf8")
    ) as { name: string }
    expect(domainPkg.name).toBe("@acme/domain")
    const ets = await readFile(join(result.targetDir, "ets.jsonc"), "utf8")
    expect(ets).toContain("\"name\": \"acme\"")
    expect(ets).toContain("\"cliVersion\"")
    expect(ets).toContain("\"$schema\"")
    expect(ets).toContain("reproducibleCommand")
    expect(ets).not.toContain("@ets/")
    await expect(stat(join(result.targetDir, "repos"))).rejects.toThrow()
  })

  test("manual-db stamps fingerprint", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-cli-manualdb-"))
    temps.push(cwd)
    const result = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "mdb", cwd, manualDb: true })))
    )
    const ets = await readFile(join(result.targetDir, "ets.jsonc"), "utf8")
    expect(ets).toContain("\"dbSetupOptions\"")
    expect(ets).toContain("\"manual\"")
  })

  test("pnpm emits workspace yaml (local version or @latest)", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-cli-pnpm-"))
    temps.push(cwd)
    const result = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "pn", cwd, packageManager: "pnpm" })))
    )
    const yaml = await readFile(join(result.targetDir, "pnpm-workspace.yaml"), "utf8")
    expect(yaml).toContain("apps/*")
    const pkg = JSON.parse(await readFile(join(result.targetDir, "package.json"), "utf8")) as {
      packageManager: string
    }
    // BTS-style: local pin or Corepack "pnpm@latest" — never leave golden bun@
    expect(pkg.packageManager === "pnpm@latest" || /^pnpm@\d+\.\d+\.\d+/.test(pkg.packageManager))
      .toBe(true)
  })

  test("npm stamps packageManager from PATH (or @latest)", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ets-cli-npm-"))
    temps.push(cwd)
    const result = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "nm", cwd, packageManager: "npm" })))
    )
    const pkg = JSON.parse(await readFile(join(result.targetDir, "package.json"), "utf8")) as {
      packageManager: string
      workspaces: unknown
    }
    expect(pkg.packageManager === "npm@latest" || /^npm@\d+\.\d+\.\d+/.test(pkg.packageManager))
      .toBe(true)
    expect(Array.isArray(pkg.workspaces)).toBe(true)
  })

  test("api=httpapi fails clearly until L3", async () => {
    const exit = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "x", cwd: tmpdir(), api: "httpapi" }))).pipe(
        Effect.exit
      )
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("httpapi")
  })

  test("effectStyle=false fails clearly until L3", async () => {
    const exit = await Effect.runPromise(
      provideBun(createProject(base({ projectName: "x", cwd: tmpdir(), effectStyle: false }))).pipe(
        Effect.exit
      )
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("effect-style")
  })

  test("resolveGoldenRoot points at examples/golden", async () => {
    const golden = resolveGoldenRoot()
    const pkg = JSON.parse(await readFile(join(golden, "package.json"), "utf8")) as {
      description: string
    }
    expect(pkg.description).toContain("Golden Sample")
    expect(golden.replaceAll("\\", "/")).toMatch(/examples\/golden$/)
  })

  test("ETS_GOLDEN_ROOT overrides resolveGoldenRoot", () => {
    const prev = process.env["ETS_GOLDEN_ROOT"]
    process.env["ETS_GOLDEN_ROOT"] = "/tmp/fake-golden"
    try {
      expect(resolveGoldenRoot()).toBe("/tmp/fake-golden")
    } finally {
      if (prev === undefined) {
        delete process.env["ETS_GOLDEN_ROOT"]
      } else {
        process.env["ETS_GOLDEN_ROOT"] = prev
      }
    }
  })

  test("CreateError tag", () => {
    expect(new CreateError({ message: "x" })).toBeInstanceOf(CreateError)
  })
})

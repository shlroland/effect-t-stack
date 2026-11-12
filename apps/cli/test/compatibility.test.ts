import { describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import {
  COMPATIBILITY_RULES,
  resolveAddInput,
  validateAddonSet,
  validateCreateOptions,
  validateGoldenAddon
} from "../src/compatibility/index.ts"
import type { CreateOptions } from "../src/create/CreateOptions.ts"

const baseOptions = (overrides: Partial<CreateOptions> = {}): CreateOptions => ({
  projectName: "demo",
  yes: true,
  yolo: false,
  install: false,
  git: false,
  dryRun: true,
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

describe("compatibility catalog", () => {
  test("stages cover enums → combinations → authAddons → examples", () => {
    const stages = [...new Set(COMPATIBILITY_RULES.map((rule) => rule.stage))]
    expect(stages).toEqual(["enums", "combinations", "authAddons", "examples"])
  })

  test("active rules include create + add gates", () => {
    const ids = COMPATIBILITY_RULES.filter((rule) => rule.status === "active").map((rule) => rule.id)
    expect(ids).toContain("create.combinations.api.rpc-only")
    expect(ids).toContain("create.addons.effect-style.required")
    expect(ids).toContain("add.addons.golden-only")
    expect(ids).toContain("add.mutex.package-or-addon")
  })
})

describe("validateCreateOptions", () => {
  test("accepts golden defaults", async () => {
    const exit = await Effect.runPromise(validateCreateOptions(baseOptions()).pipe(Effect.exit))
    expect(Exit.isSuccess(exit)).toBe(true)
  })

  test("rejects invalid packageManager enum", async () => {
    const exit = await Effect.runPromise(
      validateCreateOptions(
        baseOptions({ packageManager: "yarn" as CreateOptions["packageManager"] })
      ).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("packageManager")
  })

  test("rejects api=httpapi until L3", async () => {
    const exit = await Effect.runPromise(
      validateCreateOptions(baseOptions({ api: "httpapi" })).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("httpapi")
  })

  test("rejects --no-effect-style until L3", async () => {
    const exit = await Effect.runPromise(
      validateCreateOptions(baseOptions({ effectStyle: false })).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("effect-style")
  })
})

describe("resolveAddInput", () => {
  test("mutex rejects both fields", async () => {
    const exit = await Effect.runPromise(
      resolveAddInput({ packageName: "billing", addon: "mcp" }).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("not both")
  })

  test("resolves package", async () => {
    const value = await Effect.runPromise(resolveAddInput({ packageName: "billing" }))
    expect(value).toEqual({ kind: "package", packageName: "billing" })
  })

  test("resolves addon", async () => {
    const value = await Effect.runPromise(resolveAddInput({ addon: "mcp" }))
    expect(value).toEqual({ kind: "addon", addon: "mcp" })
  })

  test("rejects empty", async () => {
    const exit = await Effect.runPromise(resolveAddInput({}).pipe(Effect.exit))
    expect(Exit.isFailure(exit)).toBe(true)
  })
})

describe("validateGoldenAddon / validateAddonSet", () => {
  test("rejects non-golden addon", async () => {
    const exit = await Effect.runPromise(validateGoldenAddon("biome").pipe(Effect.exit))
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("biome")
  })

  test("effect-style requires repos", async () => {
    const exit = await Effect.runPromise(
      validateAddonSet(["turborepo", "effect-style"]).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("repos")
  })

  test("effect-style conflicts with biome", async () => {
    const exit = await Effect.runPromise(
      validateAddonSet(["repos", "effect-style", "biome"]).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("biome")
  })

  test("golden addon set passes", async () => {
    const exit = await Effect.runPromise(
      validateAddonSet([
        "turborepo",
        "skills",
        "repos",
        "language-service",
        "mcp",
        "effect-style"
      ]).pipe(Effect.exit)
    )
    expect(Exit.isSuccess(exit)).toBe(true)
  })
})

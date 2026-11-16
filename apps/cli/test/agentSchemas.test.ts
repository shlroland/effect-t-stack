import { describe, expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  addonOptionsJsonSchema,
  createInputJsonSchema,
  decodeAddJsonInput,
  decodeCreateJsonInput,
  toCreateOptions
} from "../src/agent/agentSchemas.ts"
import { CreateError } from "../src/shared/CreateError.ts"

describe("CreateJsonInput schema", () => {
  test("decodes minimal JSON string with defaults", async () => {
    const input = await Effect.runPromise(decodeCreateJsonInput(JSON.stringify({ projectName: "demo" })))
    expect(input).toMatchObject({
      projectName: "demo",
      yes: true,
      yolo: false,
      dryRun: false,
      install: true,
      git: true,
      packageManager: "bun",
      api: "rpc",
      effectStyle: true,
      directoryConflict: "error",
      manualDb: false
    })
    expect(toCreateOptions(input)).toMatchObject({
      projectName: "demo",
      verbose: true,
      renderTitle: false,
      packageManager: "bun"
    })
  })

  test("rejects empty stdin", async () => {
    const result = await Effect.runPromise(decodeCreateJsonInput("").pipe(Effect.flip))
    expect(result).toBeInstanceOf(CreateError)
    expect(result.message).toBe("Expected JSON on stdin")
  })

  test("rejects invalid JSON text", async () => {
    const result = await Effect.runPromise(decodeCreateJsonInput("{").pipe(Effect.flip))
    expect(result).toBeInstanceOf(CreateError)
    expect(result.message).toContain("Invalid create-json input")
  })

  test("rejects missing projectName", async () => {
    const exit = await Effect.runPromiseExit(decodeCreateJsonInput("{}"))
    expect(exit._tag).toBe("Failure")
    if (exit._tag === "Failure") {
      expect(String(exit.cause)).toContain("CreateError")
    }
  })

  test("rejects invalid api enum", async () => {
    const result = await Effect.runPromise(
      decodeCreateJsonInput(JSON.stringify({ projectName: "demo", api: "trpc" })).pipe(Effect.flip)
    )
    expect(result).toBeInstanceOf(CreateError)
    expect(result.message).toContain("Invalid create-json input")
  })

  test("createInput JSON Schema has required projectName and enums", () => {
    const schema = createInputJsonSchema()
    expect(schema["$id"]).toBe("create-effect-t-stack/createInput")
    expect(schema["$schema"]).toContain("2020-12")
    expect(schema["required"]).toEqual(["projectName"])
    const properties = schema["properties"] as Record<string, Record<string, unknown>>
    expect(properties["packageManager"]?.["enum"]).toEqual(["bun", "npm", "pnpm"])
    expect(properties["api"]?.["enum"]).toEqual(["rpc", "httpapi"])
  })
})

describe("AddJsonInput schema", () => {
  test("defaults projectDir and dryRun", async () => {
    const input = await Effect.runPromise(decodeAddJsonInput(JSON.stringify({ addon: "mcp" })))
    expect(input).toEqual({
      projectDir: ".",
      dryRun: false,
      addon: "mcp"
    })
  })

  test("rejects non-object JSON", async () => {
    const result = await Effect.runPromise(decodeAddJsonInput(JSON.stringify("nope")).pipe(Effect.flip))
    expect(result).toBeInstanceOf(CreateError)
  })
})

describe("AddonOptions JSON Schema", () => {
  test("lists default addons as optional properties", () => {
    const schema = addonOptionsJsonSchema()
    expect(schema["$id"]).toBe("create-effect-t-stack/addonOptions")
    const properties = schema["properties"] as Record<string, unknown>
    expect(properties["effect-style"]).toBeDefined()
    expect(properties["mcp"]).toBeDefined()
    expect(schema["required"]).toBeUndefined()
  })
})

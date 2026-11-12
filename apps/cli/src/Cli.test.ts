import * as BunServices from "@effect/platform-bun/BunServices"
import { describe, expect, test } from "bun:test"
import * as Command from "effect/cli/Command"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { createEffectTStack } from "./Cli.ts"
import { CreateError } from "./CreateError.ts"

const runCli = (args: ReadonlyArray<string>) =>
  Effect.runPromise(
    Command.runWith(createEffectTStack, { version: "0.1.0", renderErrors: false })([...args]).pipe(
      Effect.provide(BunServices.layer),
      Effect.exit
    )
  )

describe("create-effect-t-stack (effect/cli)", () => {
  test("dry-run succeeds without writing", async () => {
    const exit = await runCli(["demo-cli-dry", "--dry-run", "--no-render-title"])
    expect(Exit.isSuccess(exit)).toBe(true)
  })

  test("verbose dry-run succeeds", async () => {
    const exit = await runCli(["demo-verbose", "--dry-run", "--verbose", "--no-render-title"])
    expect(Exit.isSuccess(exit)).toBe(true)
  })

  test("unknown flag fails at parse time", async () => {
    const exit = await runCli(["demo", "--yes", "--not-a-real-flag"])
    expect(Exit.isFailure(exit)).toBe(true)
  })

  test("api httpapi fails in handler", async () => {
    const exit = await runCli(["demo", "--yes", "--api", "httpapi", "--no-render-title"])
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("CreateError")
  })
})

describe("CreateError", () => {
  test("is tagged", () => {
    const err = new CreateError({ message: "boom" })
    expect(err).toMatchObject({ message: "boom" })
    expect(String(err)).toContain("CreateError")
  })
})

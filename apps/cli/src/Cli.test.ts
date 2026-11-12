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
  test("rejects missing --yes without --dry-run", async () => {
    const exit = await runCli(["demo"])
    expect(Exit.isFailure(exit)).toBe(true)
    expect(String(exit)).toContain("CreateError")
  })

  test("dry-run succeeds without writing", async () => {
    const exit = await runCli(["demo-cli-dry", "--dry-run"])
    expect(Exit.isSuccess(exit)).toBe(true)
  })

  test("unknown flag fails at parse time", async () => {
    const exit = await runCli(["demo", "--yes", "--yolo"])
    expect(Exit.isFailure(exit)).toBe(true)
  })
})

describe("CreateError", () => {
  test("is tagged", () => {
    const err = new CreateError({ message: "boom" })
    expect(err).toMatchObject({ message: "boom" })
    expect(String(err)).toContain("CreateError")
  })
})

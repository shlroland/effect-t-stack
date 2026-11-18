import { describe, expect, test } from "bun:test"
import { Effect, Schema } from "effect"
import { EmptyName, Greeter, Greeting, Name } from "../src/Greeting.ts"

describe("Greeter", () => {
  test("greets a branded name", () => {
    const name = Schema.decodeSync(Name)("Roland")
    const greeting = Effect.runSync(
      Effect.gen(function*() {
        const greeter = yield* Greeter
        return yield* greeter.greet(name)
      }).pipe(Effect.provide(Greeter.layer))
    )
    expect(greeting).toEqual(Greeting.make({
      name,
      message: "Hello, Roland!"
    }))
  })

  test("rejects an empty name at the Schema boundary", () => {
    const result = Schema.decodeUnknownExit(Name)("")
    expect(result._tag).toBe("Failure")
  })

  test("EmptyName is a tagged error", () => {
    expect(new EmptyName()._tag).toBe("EmptyName")
  })
})

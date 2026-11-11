import { TodoId, TodoNotFound, TodoTitle } from "@ets/domain"
import { describe, expect, it } from "bun:test"
import { Effect } from "effect"
import { TodosTestLive } from "../test/layers.ts"
import { Todos } from "./Todos.ts"

const run = <A, E>(effect: Effect.Effect<A, E, Todos>) => Effect.runPromise(effect.pipe(Effect.provide(TodosTestLive)))

describe("Todos service", () => {
  it("creates and lists todos", async () => {
    const todos = await run(
      Effect.gen(function*() {
        const service = yield* Todos
        yield* service.create(TodoTitle.make("ship template"))
        yield* service.create(TodoTitle.make("write tests"))
        return yield* service.all()
      })
    )

    expect(todos.map((t) => String(t.title))).toEqual([
      "ship template",
      "write tests"
    ])
  })

  it("finds, updates, and removes a todo", async () => {
    const result = await run(
      Effect.gen(function*() {
        const service = yield* Todos
        const created = yield* service.create(TodoTitle.make("toggle me"))
        const found = yield* service.findById(created.id)
        const updated = yield* service.update(created.id, { completed: true })
        yield* service.remove(created.id)
        const missing = yield* service.findById(created.id).pipe(Effect.flip)
        return { found, updated, missing }
      })
    )

    expect(String(result.found.title)).toBe("toggle me")
    expect(result.updated.completed).toBe(true)
    expect(result.missing).toBeInstanceOf(TodoNotFound)
  })

  it("fails when removing a missing todo", async () => {
    const error = await run(
      Effect.gen(function*() {
        const service = yield* Todos
        return yield* service.remove(TodoId.make(99)).pipe(Effect.flip)
      })
    )
    expect(error).toBeInstanceOf(TodoNotFound)
  })

  it("returns the existing todo for an empty update patch", async () => {
    const result = await run(
      Effect.gen(function*() {
        const service = yield* Todos
        const created = yield* service.create(TodoTitle.make("unchanged"))
        const updated = yield* service.update(created.id, {})
        return { created, updated }
      })
    )

    expect(result.updated.id).toBe(result.created.id)
    expect(String(result.updated.title)).toBe("unchanged")
    expect(result.updated.completed).toBe(false)
  })

  it("fails empty update when the todo is missing", async () => {
    const error = await run(
      Effect.gen(function*() {
        const service = yield* Todos
        return yield* service.update(TodoId.make(99), {}).pipe(Effect.flip)
      })
    )
    expect(error).toBeInstanceOf(TodoNotFound)
  })
})

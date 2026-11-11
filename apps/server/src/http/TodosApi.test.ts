import { BunHttpServer } from "@effect/platform-bun"
import { DatabaseError, TodoDecodeError } from "@ets/db"
import { TodoId, TodoNotFound, TodoTitle } from "@ets/domain"
import { Api } from "@ets/protocol"
import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { HttpApiError, HttpApiTest } from "effect/http-api"
import { Todos } from "../services/Todos.ts"
import { TodosTestLive } from "../test/layers.ts"
import { TodosApiHandlers } from "./TodosHttp.ts"

const TodosHandlersLive = TodosApiHandlers.pipe(Layer.provide(TodosTestLive))

const withTodosHandlers = (todosLive: Layer.Layer<Todos>) =>
  Layer.mergeAll(
    TodosApiHandlers.pipe(Layer.provide(todosLive)),
    BunHttpServer.layerTest
  )

describe("Todos HTTP API", () => {
  it("supports todo CRUD through HttpApiTest", async () => {
    await Effect.gen(function*() {
      const client = yield* HttpApiTest.groups(Api, ["todos"])

      const created = yield* client.todos.create({
        payload: { title: TodoTitle.make("from http") }
      })
      expect(String(created.title)).toBe("from http")
      expect(created.completed).toBe(false)

      const listed = yield* client.todos.list({})
      expect(listed.some((t) => t.id === created.id)).toBe(true)

      const fetched = yield* client.todos.getById({ params: { id: created.id } })
      expect(String(fetched.title)).toBe("from http")

      const updated = yield* client.todos.update({
        params: { id: created.id },
        payload: { completed: true }
      })
      expect(updated.completed).toBe(true)

      yield* client.todos.remove({ params: { id: created.id } })

      const after = yield* client.todos.list({})
      expect(after.some((t) => t.id === created.id)).toBe(false)
    }).pipe(
      Effect.provide(Layer.mergeAll(TodosHandlersLive, BunHttpServer.layerTest)),
      Effect.scoped,
      Effect.runPromise
    )
  })

  it("returns TodoNotFound for missing get/update/remove", async () => {
    await Effect.gen(function*() {
      const client = yield* HttpApiTest.groups(Api, ["todos"])
      const missing = TodoId.make(99)

      const getError = yield* client.todos.getById({ params: { id: missing } }).pipe(Effect.flip)
      const updateError = yield* client.todos.update({
        params: { id: missing },
        payload: { completed: true }
      }).pipe(Effect.flip)
      const removeError = yield* client.todos.remove({ params: { id: missing } }).pipe(Effect.flip)

      expect(getError).toBeInstanceOf(TodoNotFound)
      expect(updateError).toBeInstanceOf(TodoNotFound)
      expect(removeError).toBeInstanceOf(TodoNotFound)
    }).pipe(
      Effect.provide(Layer.mergeAll(TodosHandlersLive, BunHttpServer.layerTest)),
      Effect.scoped,
      Effect.runPromise
    )
  })

  it("maps DatabaseError to InternalServerError", async () => {
    const FailingTodos = Layer.succeed(
      Todos,
      Todos.of({
        all: () => Effect.fail(new DatabaseError({ operation: "todos.all", cause: "boom" })),
        findById: () => Effect.die("unused"),
        create: () => Effect.die("unused"),
        update: () => Effect.die("unused"),
        remove: () => Effect.die("unused")
      })
    )

    await Effect.gen(function*() {
      const client = yield* HttpApiTest.groups(Api, ["todos"])
      const error = yield* client.todos.list({}).pipe(Effect.flip)
      expect(error).toBeInstanceOf(HttpApiError.InternalServerError)
    }).pipe(
      Effect.provide(withTodosHandlers(FailingTodos)),
      Effect.scoped,
      Effect.runPromise
    )
  })

  it("maps TodoDecodeError to InternalServerError", async () => {
    const FailingTodos = Layer.succeed(
      Todos,
      Todos.of({
        all: () =>
          Effect.fail(
            new TodoDecodeError({ operation: "todos.all.decode", cause: "bad row" })
          ),
        findById: () => Effect.die("unused"),
        create: () => Effect.die("unused"),
        update: () => Effect.die("unused"),
        remove: () => Effect.die("unused")
      })
    )

    await Effect.gen(function*() {
      const client = yield* HttpApiTest.groups(Api, ["todos"])
      const error = yield* client.todos.list({}).pipe(Effect.flip)
      expect(error).toBeInstanceOf(HttpApiError.InternalServerError)
    }).pipe(
      Effect.provide(withTodosHandlers(FailingTodos)),
      Effect.scoped,
      Effect.runPromise
    )
  })
})

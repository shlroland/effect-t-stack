import { BunHttpServer } from "@effect/platform-bun"
import { TodoTitle } from "@ets/domain"
import { Api } from "@ets/protocol"
import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { HttpApiTest } from "effect/http-api"
import { TodosTestLive } from "../test/layers.ts"
import { TodosApiHandlers } from "./TodosHttp.ts"

const TodosHandlersLive = TodosApiHandlers.pipe(Layer.provide(TodosTestLive))

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
      Effect.provide(TodosHandlersLive),
      Effect.provide(BunHttpServer.layerTest),
      Effect.scoped,
      Effect.runPromise
    )
  })
})

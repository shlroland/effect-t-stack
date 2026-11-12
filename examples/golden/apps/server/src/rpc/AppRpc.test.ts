import { TodoTitle } from "@ets/domain"
import { AppRpcs } from "@ets/protocol/rpc"
import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { RpcTest } from "effect/rpc"
import { System } from "../services/System.ts"
import { TodosTestLive } from "../test/layers.ts"
import { AppRpcHandlers } from "./AppRpcHandlers.ts"

const SystemTest = Layer.succeed(
  System,
  System.of({
    health: () => Effect.void,
    ready: () => Effect.void
  })
)

const HandlersLive = AppRpcHandlers.pipe(
  Layer.provide(TodosTestLive),
  Layer.provide(SystemTest)
)

describe("AppRpcs", () => {
  it("supports todo CRUD through RpcTest", async () => {
    await Effect.gen(function*() {
      const client = yield* RpcTest.makeClient(AppRpcs)

      const health = yield* client.Health()
      expect(health.status).toBe("ok")

      const created = yield* client.CreateTodo({ title: TodoTitle.make("from rpc") })
      expect(String(created.title)).toBe("from rpc")
      expect(created.completed).toBe(false)

      const listed = yield* client.ListTodos()
      expect(listed.some((t) => t.id === created.id)).toBe(true)

      const fetched = yield* client.GetTodo({ id: created.id })
      expect(String(fetched.title)).toBe("from rpc")

      const updated = yield* client.UpdateTodo({
        id: created.id,
        completed: true
      })
      expect(updated.completed).toBe(true)

      yield* client.RemoveTodo({ id: created.id })

      const after = yield* client.ListTodos()
      expect(after.some((t) => t.id === created.id)).toBe(false)
    }).pipe(
      Effect.scoped,
      Effect.provide(HandlersLive),
      Effect.runPromise
    )
  })
})

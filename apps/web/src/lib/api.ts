import { ApiClient } from "@ets/client"
import { TodoId, TodoTitle } from "@ets/domain"
import { Effect, ManagedRuntime } from "effect"

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3737"

const runtime = ManagedRuntime.make(ApiClient.layer(baseUrl))

export const runApi = <A, E>(
  effect: Effect.Effect<A, E, ApiClient>
): Promise<A> => runtime.runPromise(effect)

export const api = {
  listTodos: () =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.todos.list({})
    })),
  createTodo: (title: string) =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.todos.create({
        payload: { title: TodoTitle.make(title) }
      })
    })),
  updateTodo: (
    id: number,
    patch: { title?: string; completed?: boolean }
  ) =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.todos.update({
        params: { id: TodoId.make(id) },
        payload: {
          ...(patch.title !== undefined
            ? { title: TodoTitle.make(patch.title) }
            : {}),
          ...(patch.completed !== undefined
            ? { completed: patch.completed }
            : {})
        }
      })
    })),
  removeTodo: (id: number) =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.todos.remove({
        params: { id: TodoId.make(id) }
      })
    })),
  health: () =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.health()
    }))
}

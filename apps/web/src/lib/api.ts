import { ApiClient } from "@ets/client"
import { type TodoId, TodoTitle } from "@ets/domain"
import { Effect, ManagedRuntime } from "effect"

/** Same-origin by default (Start embeds HttpApi). Override for standalone `apps/server`. */
const baseUrl = import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")

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
    id: TodoId,
    patch: { title?: string; completed?: boolean }
  ) =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.todos.update({
        params: { id },
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
  removeTodo: (id: TodoId) =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.todos.remove({
        params: { id }
      })
    })),
  ready: () =>
    runApi(Effect.gen(function*() {
      const client = yield* ApiClient
      return yield* client.ready({})
    }))
}

import { AppRpcClient } from "@ets/client"
import { TodoId, TodoTitle } from "@ets/domain"
import { Effect, ManagedRuntime } from "effect"

/** Same-origin by default; points at Effect Rpc under `/rpc`. */
const baseUrl = import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")

const runtime = ManagedRuntime.make(AppRpcClient.layer(baseUrl))

export const runRpc = <A, E>(
  effect: Effect.Effect<A, E, AppRpcClient>
): Promise<A> => runtime.runPromise(effect)

/** Optional Effect Rpc client helpers (secondary to HttpApi `api.ts`). */
export const rpc = {
  listTodos: () =>
    runRpc(Effect.gen(function*() {
      const client = yield* AppRpcClient
      return yield* client.ListTodos()
    })),
  createTodo: (title: string) =>
    runRpc(Effect.gen(function*() {
      const client = yield* AppRpcClient
      return yield* client.CreateTodo({ title: TodoTitle.make(title) })
    })),
  updateTodo: (
    id: number,
    patch: { title?: string; completed?: boolean }
  ) =>
    runRpc(Effect.gen(function*() {
      const client = yield* AppRpcClient
      return yield* client.UpdateTodo({
        id: TodoId.make(id),
        ...(patch.title !== undefined ? { title: TodoTitle.make(patch.title) } : {}),
        ...(patch.completed !== undefined ? { completed: patch.completed } : {})
      })
    })),
  removeTodo: (id: number) =>
    runRpc(Effect.gen(function*() {
      const client = yield* AppRpcClient
      return yield* client.RemoveTodo({ id: TodoId.make(id) })
    })),
  health: () =>
    runRpc(Effect.gen(function*() {
      const client = yield* AppRpcClient
      return yield* client.Health()
    }))
}

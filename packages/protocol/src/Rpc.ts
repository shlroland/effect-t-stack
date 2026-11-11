import { HealthResponse, ReadyResponse, Todo, TodoId, TodoNotFound, TodoTitle } from "@ets/domain"
import { Schema } from "effect"
import { Rpc, RpcGroup } from "effect/rpc"

/**
 * Mount path for Effect Rpc (HTTP protocol).
 * Distinct from {@link ApiPrefix} (`/api`), which is HttpApi.
 */
export const RpcPrefix = "/rpc" as const

/**
 * Secondary API surface built with Effect `Rpc` / `RpcGroup`.
 * Primary golden path remains HttpApi under `/api`.
 */
export const AppRpcs = RpcGroup.make(
  Rpc.make("Health", {
    success: HealthResponse
  }),
  Rpc.make("Ready", {
    success: ReadyResponse
  }),
  Rpc.make("ListTodos", {
    success: Schema.Array(Todo)
  }),
  Rpc.make("CreateTodo", {
    payload: { title: TodoTitle },
    success: Todo
  }),
  Rpc.make("GetTodo", {
    payload: { id: TodoId },
    success: Todo,
    error: TodoNotFound
  }),
  Rpc.make("UpdateTodo", {
    payload: {
      id: TodoId,
      title: Schema.optional(TodoTitle),
      completed: Schema.optional(Schema.Boolean)
    },
    success: Todo,
    error: TodoNotFound
  }),
  Rpc.make("RemoveTodo", {
    payload: { id: TodoId },
    success: Schema.Void,
    error: TodoNotFound
  })
)

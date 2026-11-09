import { Api } from "@ets/protocol"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { Todos } from "../services/Todos.ts"
import { mapUnexpectedErrors } from "./Errors.ts"

export const TodosApiHandlers = HttpApiBuilder.group(
  Api,
  "todos",
  Effect.fn(function*(handlers) {
    const todos = yield* Todos

    return handlers
      .handle("list", () => mapUnexpectedErrors(todos.all()))
      .handle("create", ({ payload }) =>
        mapUnexpectedErrors(todos.create(payload.title)))
      .handle("getById", ({ params }) =>
        mapUnexpectedErrors(todos.findById(params.id)))
      .handle("update", ({ params, payload }) =>
        mapUnexpectedErrors(todos.update(params.id, payload)))
      .handle("remove", ({ params }) =>
        mapUnexpectedErrors(todos.remove(params.id)))
  })
)

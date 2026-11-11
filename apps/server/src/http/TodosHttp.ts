import { Api } from "@ets/protocol/http-api"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { Todos } from "../services/Todos.ts"
import { mapUnexpectedErrors } from "./Errors.ts"

export const TodosApiHandlers = HttpApiBuilder.group(
  Api,
  "todos",
  Effect.fn("TodosHttp")(function*(handlers) {
    const todos = yield* Todos

    return handlers
      .handle(
        "list",
        Effect.fn("TodosHttp.list")(function*() {
          return yield* mapUnexpectedErrors(todos.all())
        })
      )
      .handle(
        "create",
        Effect.fn("TodosHttp.create")(function*({ payload }) {
          return yield* mapUnexpectedErrors(todos.create(payload.title))
        })
      )
      .handle(
        "getById",
        Effect.fn("TodosHttp.getById")(function*({ params }) {
          return yield* mapUnexpectedErrors(todos.findById(params.id))
        })
      )
      .handle(
        "update",
        Effect.fn("TodosHttp.update")(function*({ params, payload }) {
          return yield* mapUnexpectedErrors(todos.update(params.id, payload))
        })
      )
      .handle(
        "remove",
        Effect.fn("TodosHttp.remove")(function*({ params }) {
          return yield* mapUnexpectedErrors(todos.remove(params.id))
        })
      )
  })
)

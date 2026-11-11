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
          return yield* todos.all().pipe(mapUnexpectedErrors)
        })
      )
      .handle(
        "create",
        Effect.fn("TodosHttp.create")(function*({ payload }) {
          return yield* todos.create(payload.title).pipe(mapUnexpectedErrors)
        })
      )
      .handle(
        "getById",
        Effect.fn("TodosHttp.getById")(function*({ params }) {
          return yield* todos.findById(params.id).pipe(mapUnexpectedErrors)
        })
      )
      .handle(
        "update",
        Effect.fn("TodosHttp.update")(function*({ params, payload }) {
          return yield* todos.update(params.id, payload).pipe(mapUnexpectedErrors)
        })
      )
      .handle(
        "remove",
        Effect.fn("TodosHttp.remove")(function*({ params }) {
          return yield* todos.remove(params.id).pipe(mapUnexpectedErrors)
        })
      )
  })
)

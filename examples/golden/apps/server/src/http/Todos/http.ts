import { Api } from "@ets/protocol/http-api"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { Todos } from "../../services/Todos.ts"
import { mapUnexpectedErrors } from "../Errors.ts"

/**
 * HttpApi handlers for the `todos` group.
 * Layout mirrors Effect ai-docs fixtures: `server/<Resource>/http.ts`.
 */
export const TodosApiHandlers = HttpApiBuilder.group(
  Api,
  "todos",
  Effect.fn("TodosApi")(function*(handlers) {
    const todos = yield* Todos

    return handlers
      .handle(
        "list",
        Effect.fn("TodosApi.list")(function*() {
          return yield* mapUnexpectedErrors(todos.all())
        })
      )
      .handle(
        "create",
        Effect.fn("TodosApi.create")(function*({ payload }) {
          return yield* mapUnexpectedErrors(todos.create(payload.title))
        })
      )
      .handle(
        "getById",
        Effect.fn("TodosApi.getById")(function*({ params }) {
          return yield* mapUnexpectedErrors(todos.findById(params.id))
        })
      )
      .handle(
        "update",
        Effect.fn("TodosApi.update")(function*({ params, payload }) {
          return yield* mapUnexpectedErrors(todos.update(params.id, payload))
        })
      )
      .handle(
        "remove",
        Effect.fn("TodosApi.remove")(function*({ params }) {
          return yield* mapUnexpectedErrors(todos.remove(params.id))
        })
      )
  })
)

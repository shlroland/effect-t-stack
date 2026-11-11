import { Todo, TodoId, TodoNotFound, TodoTitle } from "@ets/domain"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api"

export class TodosApiGroup extends HttpApiGroup.make("todos")
  .add(
    HttpApiEndpoint.get("list", "/", {
      success: Schema.Array(Todo),
      error: HttpApiError.InternalServerErrorNoContent
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({ title: TodoTitle }),
      success: Todo,
      error: HttpApiError.InternalServerErrorNoContent
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: TodoId },
      success: Todo,
      error: [TodoNotFound, HttpApiError.InternalServerErrorNoContent]
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: { id: TodoId },
      success: Schema.Void,
      error: [TodoNotFound, HttpApiError.InternalServerErrorNoContent]
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: TodoId },
      payload: Schema.Struct({
        title: Schema.optional(TodoTitle),
        completed: Schema.optional(Schema.Boolean)
      }),
      success: Todo,
      error: [TodoNotFound, HttpApiError.InternalServerErrorNoContent]
    })
  )
  .prefix("/todos")
{}

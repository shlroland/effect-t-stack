import { Schema } from "effect"

export const TodoId = Schema.Number.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

export const TodoTitle = Schema.String.pipe(
  Schema.check(Schema.isMinLength(1)),
  Schema.brand("TodoTitle")
)
export type TodoTitle = typeof TodoTitle.Type

export class Todo extends Schema.Class<Todo>("Todo")({
  id: TodoId,
  title: TodoTitle,
  completed: Schema.Boolean,
  createdAt: Schema.Date
}) {}

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  "TodoNotFound",
  { id: TodoId },
  { httpApiStatus: 404 }
) {}

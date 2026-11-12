import { Schema } from "effect"

export class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", {
  operation: Schema.String,
  cause: Schema.Unknown
}) {}

export class TodoDecodeError extends Schema.TaggedError<TodoDecodeError>()("TodoDecodeError", {
  operation: Schema.String,
  cause: Schema.Unknown
}) {}

export type TodosRepositoryError = DatabaseError | TodoDecodeError

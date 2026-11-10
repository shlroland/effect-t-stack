import { Todo, type TodoId, type TodoTitle } from "@ets/domain"
import { eq } from "drizzle-orm"
import { Context, Effect, Layer, Schema } from "effect"
import { Database, type DatabaseError, mapDatabaseError } from "./Database.ts"
import { todos } from "./schema.ts"

const decodeTodo = Schema.decodeUnknownEffect(Todo)

export class TodoDecodeError extends Schema.TaggedError<TodoDecodeError>()("TodoDecodeError", {
  operation: Schema.String,
  cause: Schema.Unknown
}) {}

export type TodosRepositoryError = DatabaseError | TodoDecodeError

const decodePersistedTodo = (
  operation: string,
  row: unknown
): Effect.Effect<Todo, TodoDecodeError> =>
  decodeTodo(row).pipe(
    Effect.mapError((cause) => new TodoDecodeError({ operation, cause }))
  )

export class TodosRepository extends Context.Service<TodosRepository, {
  readonly all: () => Effect.Effect<ReadonlyArray<Todo>, TodosRepositoryError>
  readonly findById: (id: TodoId) => Effect.Effect<Todo | undefined, TodosRepositoryError>
  readonly create: (title: TodoTitle) => Effect.Effect<Todo, TodosRepositoryError>
  readonly update: (
    id: TodoId,
    patch: {
      readonly title?: TodoTitle | undefined
      readonly completed?: boolean | undefined
    }
  ) => Effect.Effect<Todo | undefined, TodosRepositoryError>
  readonly remove: (id: TodoId) => Effect.Effect<boolean, DatabaseError>
}>()("@ets/db/TodosRepository") {
  static readonly layerNoDeps = Layer.effect(
    TodosRepository,
    Effect.gen(function*() {
      const db = yield* Database

      const all = Effect.fn("TodosRepository.all")(function*() {
        const rows = yield* mapDatabaseError("todos.all", db.select().from(todos))
        return yield* Effect.forEach(rows, (row) => decodePersistedTodo("todos.all.decode", row))
      })

      const findById = Effect.fn("TodosRepository.findById")(function*(id: TodoId) {
        const row = yield* mapDatabaseError(
          "todos.findById",
          db.select().from(todos).where(eq(todos.id, id)).limit(1).get()
        )
        if (!row) return undefined
        return yield* decodePersistedTodo("todos.findById.decode", row)
      })

      const create = Effect.fn("TodosRepository.create")(function*(title: TodoTitle) {
        const row = yield* mapDatabaseError(
          "todos.create",
          db.insert(todos).values({ title }).returning().get()
        )
        return yield* decodePersistedTodo("todos.create.decode", row)
      })

      const update = Effect.fn("TodosRepository.update")(function*(
        id: TodoId,
        patch: {
          readonly title?: TodoTitle | undefined
          readonly completed?: boolean | undefined
        }
      ) {
        const values: { title?: string; completed?: boolean } = {}
        if (patch.title !== undefined) values.title = patch.title
        if (patch.completed !== undefined) values.completed = patch.completed
        if (Object.keys(values).length === 0) {
          return yield* findById(id)
        }
        const row = yield* mapDatabaseError(
          "todos.update",
          db.update(todos).set(values).where(eq(todos.id, id)).returning().get()
        )
        if (!row) return undefined
        return yield* decodePersistedTodo("todos.update.decode", row)
      })

      const remove = Effect.fn("TodosRepository.remove")(function*(id: TodoId) {
        const deleted = yield* mapDatabaseError(
          "todos.remove",
          db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id })
        )
        return deleted.length > 0
      })

      return TodosRepository.of({ all, findById, create, update, remove })
    })
  )

  static readonly layer = (databaseUrl: string) => this.layerNoDeps.pipe(Layer.provide(Database.layer(databaseUrl)))
}

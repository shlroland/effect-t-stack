import { Todo, TodoId, type TodoTitle, TodoTitle as TodoTitleSchema } from "@ets/domain"
import { Effect, Layer, Option, Schema } from "effect"
import { SqlClient, SqlSchema } from "effect/sql"
import type { Fragment } from "effect/sql/Statement"
import { DatabaseError, mapDatabaseError } from "../Database.ts"
import { TodoDecodeError } from "../errors.ts"
import { TodosRepository } from "../TodosRepository.ts"
import { Database } from "./Database.ts"

const TodoRow = Schema.Struct({
  id: TodoId,
  title: TodoTitleSchema,
  completed: Schema.BooleanFromBit,
  created_at: Schema.DateFromMillis
})

const toTodo = (row: typeof TodoRow.Type): Todo =>
  new Todo({
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at
  })

const mapQueryError = <A, E extends { readonly _tag: string }, R>(
  operation: string,
  effect: Effect.Effect<A, E, R>
) =>
  effect.pipe(
    Effect.mapError((cause) =>
      cause._tag === "SchemaError" || cause._tag === "NoSuchElementError"
        ? new TodoDecodeError({ operation: `${operation}.decode`, cause })
        : new DatabaseError({ operation, cause })
    )
  )

/**
 * Effect SQL implementation of the shared `TodosRepository` service tag.
 */
export const layerNoDeps = Layer.effect(
  TodosRepository,
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    const selectAll = SqlSchema.findAll({
      Request: Schema.Void,
      Result: TodoRow,
      execute: () => sql`SELECT id, title, completed, created_at FROM todos ORDER BY id`
    })

    const selectById = SqlSchema.findOneOption({
      Request: TodoId,
      Result: TodoRow,
      execute: (id) => sql`SELECT id, title, completed, created_at FROM todos WHERE id = ${id} LIMIT 1`
    })

    const insertTodo = SqlSchema.findOne({
      Request: TodoTitleSchema,
      Result: TodoRow,
      execute: (title) => sql`INSERT INTO todos (title) VALUES (${title}) RETURNING id, title, completed, created_at`
    })

    const deleteById = SqlSchema.findAll({
      Request: TodoId,
      Result: Schema.Struct({ id: TodoId }),
      execute: (id) => sql`DELETE FROM todos WHERE id = ${id} RETURNING id`
    })

    const all = Effect.fn("TodosRepository.all")(function*() {
      const rows = yield* mapQueryError("todos.all", selectAll(undefined))
      return rows.map(toTodo)
    })

    const findById = Effect.fn("TodosRepository.findById")(function*(id: TodoId) {
      const row = yield* mapQueryError("todos.findById", selectById(id))
      return Option.match(row, {
        onNone: () => undefined,
        onSome: toTodo
      })
    })

    const create = Effect.fn("TodosRepository.create")(function*(title: TodoTitle) {
      const row = yield* mapQueryError("todos.create", insertTodo(title))
      return toTodo(row)
    })

    const update = Effect.fn("TodosRepository.update")(function*(
      id: TodoId,
      patch: {
        readonly title?: TodoTitle | undefined
        readonly completed?: boolean | undefined
      }
    ) {
      const clauses: Array<Fragment> = []
      if (patch.title !== undefined) {
        clauses.push(sql`title = ${patch.title}`)
      }
      if (patch.completed !== undefined) {
        clauses.push(sql`completed = ${patch.completed ? 1 : 0}`)
      }
      // Empty patch is a Service rule (return existing / TodoNotFound).
      if (clauses.length === 0) {
        return undefined
      }

      const rows = yield* mapDatabaseError(
        "todos.update",
        sql`
          UPDATE todos
          SET ${sql.csv(clauses)}
          WHERE id = ${id}
          RETURNING id, title, completed, created_at
        `
      )
      const row = rows[0]
      if (!row) return undefined
      return yield* Schema.decodeUnknownEffect(TodoRow)(row).pipe(
        Effect.map(toTodo),
        Effect.mapError((cause) => new TodoDecodeError({ operation: "todos.update.decode", cause }))
      )
    })

    const remove = Effect.fn("TodosRepository.remove")(function*(id: TodoId) {
      const deleted = yield* deleteById(id).pipe(
        Effect.mapError((cause) => new DatabaseError({ operation: "todos.remove", cause }))
      )
      return deleted.length > 0
    })

    return TodosRepository.of({ all, findById, create, update, remove })
  })
)

export const layer = (databaseUrl: string) => layerNoDeps.pipe(Layer.provide(Database.layer(databaseUrl)))

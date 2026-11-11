import type { DatabaseError, TodoDecodeError } from "@ets/db"
import { AppRpcs } from "@ets/protocol/rpc"
import { Effect } from "effect"
import { System } from "../services/System.ts"
import { Todos } from "../services/Todos.ts"

/** Pipeable: unexpected infra / decode errors become defects; domain errors pass through. */
const dieUnexpected = <A, E, R>(
  self: Effect.Effect<A, E | DatabaseError | TodoDecodeError, R>
) =>
  self.pipe(
    Effect.catchTag("DatabaseError", (error) => Effect.die(error)),
    Effect.catchTag("TodoDecodeError", (error) => Effect.die(error))
  )

/**
 * Effect Rpc handlers for {@link AppRpcs}.
 * Reuses the same Todos / System services as HttpApi.
 */
export const AppRpcHandlers = AppRpcs.toLayer(
  Effect.gen(function*() {
    const todos = yield* Todos
    const system = yield* System

    return {
      Health: () => system.health(),
      Ready: () => system.ready().pipe(Effect.catchTag("DatabaseError", (error) => Effect.die(error))),
      ListTodos: () => todos.all().pipe(dieUnexpected),
      CreateTodo: ({ title }) => todos.create(title).pipe(dieUnexpected),
      GetTodo: ({ id }) => todos.findById(id).pipe(dieUnexpected),
      UpdateTodo: ({ id, title, completed }) =>
        todos.update(id, {
          ...(title !== undefined ? { title } : {}),
          ...(completed !== undefined ? { completed } : {})
        }).pipe(dieUnexpected),
      RemoveTodo: ({ id }) => todos.remove(id).pipe(dieUnexpected)
    }
  })
)

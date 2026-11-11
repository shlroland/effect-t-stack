import type { DatabaseError, TodoDecodeError } from "@ets/db"
import { AppRpcs } from "@ets/protocol"
import { Effect } from "effect"
import { System } from "../services/System.ts"
import { Todos } from "../services/Todos.ts"

const mapUnexpected = <A, E, R>(
  effect: Effect.Effect<A, E | DatabaseError | TodoDecodeError, R>
) =>
  effect.pipe(
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
      Ready: () =>
        system.ready().pipe(
          Effect.catchTag("DatabaseError", (error) => Effect.die(error))
        ),
      ListTodos: () => mapUnexpected(todos.all()),
      CreateTodo: ({ title }) => mapUnexpected(todos.create(title)),
      GetTodo: ({ id }) => mapUnexpected(todos.findById(id)),
      UpdateTodo: ({ id, title, completed }) =>
        mapUnexpected(todos.update(id, {
          ...(title !== undefined ? { title } : {}),
          ...(completed !== undefined ? { completed } : {})
        })),
      RemoveTodo: ({ id }) => mapUnexpected(todos.remove(id))
    }
  })
)

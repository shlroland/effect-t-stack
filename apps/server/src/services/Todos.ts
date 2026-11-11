import { TodosRepository, type TodosRepositoryError } from "@ets/db"
import { type Todo, type TodoId, TodoNotFound, type TodoTitle } from "@ets/domain"
import { Context, Effect, Layer } from "effect"

export class Todos extends Context.Service<Todos, {
  readonly all: () => Effect.Effect<ReadonlyArray<Todo>, TodosRepositoryError>
  readonly findById: (id: TodoId) => Effect.Effect<Todo, TodoNotFound | TodosRepositoryError>
  readonly create: (title: TodoTitle) => Effect.Effect<Todo, TodosRepositoryError>
  readonly update: (
    id: TodoId,
    patch: {
      readonly title?: TodoTitle | undefined
      readonly completed?: boolean | undefined
    }
  ) => Effect.Effect<Todo, TodoNotFound | TodosRepositoryError>
  readonly remove: (id: TodoId) => Effect.Effect<void, TodoNotFound | TodosRepositoryError>
}>()("@ets/server/Todos") {
  static readonly layerNoDeps = Layer.effect(
    Todos,
    Effect.gen(function*() {
      const repository = yield* TodosRepository

      const findById = Effect.fn("Todos.findById")(function*(id: TodoId) {
        const todo = yield* repository.findById(id)
        if (!todo) return yield* new TodoNotFound({ id })
        return todo
      })

      const update = Effect.fn("Todos.update")(function*(
        id: TodoId,
        patch: {
          readonly title?: TodoTitle | undefined
          readonly completed?: boolean | undefined
        }
      ) {
        if (patch.title === undefined && patch.completed === undefined) {
          return yield* findById(id)
        }
        const todo = yield* repository.update(id, patch)
        if (!todo) return yield* new TodoNotFound({ id })
        return todo
      })

      const remove = Effect.fn("Todos.remove")(function*(id: TodoId) {
        const deleted = yield* repository.remove(id)
        if (!deleted) return yield* new TodoNotFound({ id })
      })

      return Todos.of({
        all: () => repository.all(),
        create: (title) => repository.create(title),
        findById,
        update,
        remove
      })
    })
  )

  static readonly layer = this.layerNoDeps.pipe(
    Layer.provide(TodosRepository.layerNoDeps)
  )
}

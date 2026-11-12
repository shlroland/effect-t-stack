import { TodosRepository } from "@ets/db"
import { Todo, type TodoId, type TodoTitle } from "@ets/domain"
import { Context, Effect, Layer, Ref } from "effect"
import { Todos } from "../services/Todos.ts"

export class TodosRepositoryTestState extends Context.Service<
  TodosRepositoryTestState,
  Ref.Ref<ReadonlyArray<Todo>>
>()("@ets/server/test/TodosRepositoryTestState") {
  static readonly layer = Layer.effect(
    TodosRepositoryTestState,
    Ref.make<ReadonlyArray<Todo>>([])
  )
}

export const TodosRepositoryTest = Layer.effect(
  TodosRepository,
  Effect.gen(function*() {
    const state = yield* TodosRepositoryTestState

    const all = Effect.fn("TodosRepositoryTest.all")(function*() {
      return yield* Ref.get(state)
    })

    const findById = Effect.fn("TodosRepositoryTest.findById")(function*(id: TodoId) {
      const items = yield* Ref.get(state)
      return items.find((todo) => todo.id === id)
    })

    const create = Effect.fn("TodosRepositoryTest.create")(function*(title: TodoTitle) {
      const current = yield* Ref.get(state)
      const id = (current.length + 1) as TodoId
      const todo = new Todo({
        id,
        title,
        completed: false,
        createdAt: new Date(0)
      })
      yield* Ref.set(state, [...current, todo])
      return todo
    })

    const update = Effect.fn("TodosRepositoryTest.update")(function*(
      id: TodoId,
      patch: {
        readonly title?: TodoTitle | undefined
        readonly completed?: boolean | undefined
      }
    ) {
      const current = yield* Ref.get(state)
      const index = current.findIndex((todo) => todo.id === id)
      if (index < 0) return undefined
      const existing = current[index]!
      const next = new Todo({
        id: existing.id,
        title: patch.title ?? existing.title,
        completed: patch.completed ?? existing.completed,
        createdAt: existing.createdAt
      })
      const copy = current.slice()
      copy[index] = next
      yield* Ref.set(state, copy)
      return next
    })

    const remove = Effect.fn("TodosRepositoryTest.remove")(function*(id: TodoId) {
      const current = yield* Ref.get(state)
      const next = current.filter((todo) => todo.id !== id)
      yield* Ref.set(state, next)
      return next.length !== current.length
    })

    return TodosRepository.of({ all, findById, create, update, remove })
  })
).pipe(Layer.provideMerge(TodosRepositoryTestState.layer))

export const TodosTestLive = Todos.layerNoDeps.pipe(
  Layer.provideMerge(TodosRepositoryTest)
)

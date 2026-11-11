import { Todo, TodoId, TodoTitle } from "@ets/domain"
import { Effect } from "effect"
import { AsyncResult, Atom } from "effect/reactivity"
import { ApiAtoms, todosReactivityKeys } from "./api.ts"

/** Serializable query atom — dehydrated on the server, hydrated into the client registry. */
export const todosQueryAtom = ApiAtoms.query("todos", "list", {
  reactivityKeys: todosReactivityKeys,
  timeToLive: "30 seconds",
  serializationKey: "list"
})

export const todosListAtom = Atom.optimistic(todosQueryAtom)

const mapSuccess = <E>(
  current: AsyncResult.AsyncResult<ReadonlyArray<Todo>, E>,
  f: (todos: ReadonlyArray<Todo>) => ReadonlyArray<Todo>
): AsyncResult.AsyncResult<ReadonlyArray<Todo>, E> => {
  if (!AsyncResult.isSuccess(current)) return current
  return AsyncResult.success(f(current.value))
}

export type CreateTodoInput = string

export const createTodoAtom = todosListAtom.pipe(
  Atom.optimisticFn({
    reducer: (current, title: CreateTodoInput) =>
      mapSuccess(current, (todos) => [
        ...todos,
        new Todo({
          id: TodoIdTemp(),
          title: TodoTitle.make(title),
          completed: false,
          createdAt: new Date()
        })
      ]),
    fn: ApiAtoms.runtime.fn(
      Effect.fnUntraced(function*(title: CreateTodoInput) {
        const client = yield* ApiAtoms
        return yield* client.todos.create({
          payload: { title: TodoTitle.make(title) }
        })
      }),
      { reactivityKeys: todosReactivityKeys }
    )
  })
)

export type UpdateTodoInput = {
  readonly id: TodoId
  readonly title?: string
  readonly completed?: boolean
}

export const updateTodoAtom = todosListAtom.pipe(
  Atom.optimisticFn({
    reducer: (current, patch: UpdateTodoInput) =>
      mapSuccess(current, (todos) =>
        todos.map((todo) =>
          todo.id === patch.id
            ? new Todo({
              id: todo.id,
              title: patch.title !== undefined ? TodoTitle.make(patch.title) : todo.title,
              completed: patch.completed !== undefined ? patch.completed : todo.completed,
              createdAt: todo.createdAt
            })
            : todo
        )),
    fn: ApiAtoms.runtime.fn(
      Effect.fnUntraced(function*(patch: UpdateTodoInput) {
        const client = yield* ApiAtoms
        return yield* client.todos.update({
          params: { id: patch.id },
          payload: {
            ...(patch.title !== undefined ? { title: TodoTitle.make(patch.title) } : {}),
            ...(patch.completed !== undefined ? { completed: patch.completed } : {})
          }
        })
      }),
      { reactivityKeys: todosReactivityKeys }
    )
  })
)

export type RemoveTodoInput = TodoId

export const removeTodoAtom = todosListAtom.pipe(
  Atom.optimisticFn({
    reducer: (current, id: RemoveTodoInput) => mapSuccess(current, (todos) => todos.filter((todo) => todo.id !== id)),
    fn: ApiAtoms.runtime.fn(
      Effect.fnUntraced(function*(id: RemoveTodoInput) {
        const client = yield* ApiAtoms
        return yield* client.todos.remove({
          params: { id }
        })
      }),
      { reactivityKeys: todosReactivityKeys }
    )
  })
)

export const clearCompletedAtom = todosListAtom.pipe(
  Atom.optimisticFn({
    reducer: (current) => mapSuccess(current, (todos) => todos.filter((todo) => !todo.completed)),
    fn: ApiAtoms.runtime.fn(
      Effect.fnUntraced(function*() {
        const client = yield* ApiAtoms
        const todos = yield* client.todos.list({})
        yield* Effect.forEach(
          todos.filter((todo) => todo.completed),
          (todo) => client.todos.remove({ params: { id: todo.id } }),
          { concurrency: "unbounded" }
        )
      }),
      { reactivityKeys: todosReactivityKeys }
    )
  })
)

export const todosSyncingAtom = Atom.make((get) => AsyncResult.isWaiting(get(todosListAtom)))

/** Temporary client ids for optimistic creates; replaced after server refresh. */
function TodoIdTemp(): TodoId {
  return TodoId.make(-Date.now())
}

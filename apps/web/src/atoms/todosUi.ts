import type { Todo, TodoId } from "@ets/domain"
import { AsyncResult, Atom } from "effect/reactivity"
import { todosListAtom } from "./todos.ts"

export type TodoFilter = "all" | "active" | "completed"

const filterParamAtom = Atom.searchParam("filter")

export const filterAtom = Atom.writable(
  (get): TodoFilter => {
    const raw = get(filterParamAtom)
    return raw === "active" || raw === "completed" ? raw : "all"
  },
  (ctx, value: TodoFilter) => {
    ctx.set(filterParamAtom, value === "all" ? "" : value)
  }
)

export const searchAtom = Atom.make("")
export const draftTitleAtom = Atom.make("")
export const editingIdAtom = Atom.make<TodoId | null>(null)
export const editingTitleAtom = Atom.make("")

export type TodoCounts = {
  readonly total: number
  readonly active: number
  readonly completed: number
}

export const todoCountsAtom = Atom.make((get): TodoCounts => {
  const result = get(todosListAtom)
  if (!AsyncResult.isSuccess(result)) {
    return { total: 0, active: 0, completed: 0 }
  }
  let active = 0
  let completed = 0
  for (const todo of result.value) {
    if (todo.completed) completed++
    else active++
  }
  return { total: result.value.length, active, completed }
})

export const visibleTodosAtom = Atom.make((get): ReadonlyArray<Todo> => {
  const result = get(todosListAtom)
  if (!AsyncResult.isSuccess(result)) return []

  const filter = get(filterAtom)
  const search = get(searchAtom).trim().toLowerCase()

  return result.value.filter((todo) => {
    if (filter === "active" && todo.completed) return false
    if (filter === "completed" && !todo.completed) return false
    if (search.length > 0 && !todo.title.toLowerCase().includes(search)) return false
    return true
  })
})

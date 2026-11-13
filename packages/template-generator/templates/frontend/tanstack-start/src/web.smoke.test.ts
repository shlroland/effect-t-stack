import { describe, expect, it } from "bun:test"
import { dehydrateTodosListPromise } from "./atoms/dehydrateTodos.ts"
import { createTodoAtom, removeTodoAtom, todosListAtom, updateTodoAtom } from "./atoms/todos.ts"

describe("web smoke", () => {
  it("exposes Atom todos surface used by the home route", () => {
    expect(todosListAtom).toBeDefined()
    expect(createTodoAtom).toBeDefined()
    expect(updateTodoAtom).toBeDefined()
    expect(removeTodoAtom).toBeDefined()
    expect(typeof dehydrateTodosListPromise).toBe("function")
  })
})

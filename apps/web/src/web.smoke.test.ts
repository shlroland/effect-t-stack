import { describe, expect, it } from "bun:test"
import { api } from "./lib/api.ts"

describe("web smoke", () => {
  it("exposes api helpers used by the home loader", () => {
    expect(typeof api.listTodos).toBe("function")
    expect(typeof api.ready).toBe("function")
    expect(typeof api.createTodo).toBe("function")
    expect(typeof api.updateTodo).toBe("function")
    expect(typeof api.removeTodo).toBe("function")
  })
})

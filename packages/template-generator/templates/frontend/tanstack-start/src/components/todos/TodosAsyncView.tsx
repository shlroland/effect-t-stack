import { useAtomValue } from "@effect/atom-react"
import { Cause } from "effect"
import { AsyncResult } from "effect/reactivity"
import { todosListAtom } from "../../atoms/todos.ts"
import { TodoComposer } from "./TodoComposer.tsx"
import { TodoFilters } from "./TodoFilters.tsx"
import { TodoList } from "./TodoList.tsx"
import { TodoStatus } from "./TodoStatus.tsx"

export function TodosAsyncView() {
  const result = useAtomValue(todosListAtom)

  return AsyncResult.builder(result)
    .onInitial(() => <p className="status">加载 Todo…</p>)
    .onSuccess(() => (
      <>
        <TodoComposer />
        <TodoFilters />
        <TodoList />
        <TodoStatus />
      </>
    ))
    .onFailure((cause) => {
      const squashed = Cause.squash(cause)
      const message = squashed instanceof Error ? squashed.message : String(squashed)
      return <p className="status error">API 错误：{message}</p>
    })
    .exhaustive()
}

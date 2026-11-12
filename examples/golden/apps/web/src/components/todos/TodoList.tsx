import { useAtomValue } from "@effect/atom-react"
import { visibleTodosAtom } from "../../atoms/todosUi.ts"
import { TodoItem } from "./TodoItem.tsx"

export function TodoList() {
  const todos = useAtomValue(visibleTodosAtom)

  if (todos.length === 0) {
    return <p className="empty-state">没有匹配的 Todo。</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
    </ul>
  )
}

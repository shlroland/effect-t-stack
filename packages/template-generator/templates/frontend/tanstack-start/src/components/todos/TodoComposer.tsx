import { useAtom, useAtomSet } from "@effect/atom-react"
import type { FormEvent } from "react"
import { createTodoAtom } from "../../atoms/todos.ts"
import { draftTitleAtom } from "../../atoms/todosUi.ts"

export function TodoComposer() {
  const [title, setTitle] = useAtom(draftTitleAtom)
  const createTodo = useAtomSet(createTodoAtom)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next = title.trim()
    if (!next) return
    createTodo(next)
    setTitle("")
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="添加一个 Todo…"
        aria-label="Todo title"
      />
      <button type="submit">添加</button>
    </form>
  )
}

import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react"
import type { Todo } from "@ets/domain"
import type { FormEvent, KeyboardEvent } from "react"
import { removeTodoAtom, updateTodoAtom } from "../../atoms/todos.ts"
import { editingIdAtom, editingTitleAtom } from "../../atoms/todosUi.ts"

export function TodoItem({ todo }: { readonly todo: Todo }) {
  const editingId = useAtomValue(editingIdAtom)
  const setEditingId = useAtomSet(editingIdAtom)
  const [editingTitle, setEditingTitle] = useAtom(editingTitleAtom)
  const updateTodo = useAtomSet(updateTodoAtom)
  const removeTodo = useAtomSet(removeTodoAtom)

  const editing = editingId === todo.id

  const startEdit = () => {
    setEditingId(todo.id)
    setEditingTitle(todo.title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  const commitEdit = () => {
    const next = editingTitle.trim()
    if (!next || next === todo.title) {
      cancelEdit()
      return
    }
    updateTodo({ id: todo.id, title: next })
    cancelEdit()
  }

  const onEditSubmit = (event: FormEvent) => {
    event.preventDefault()
    commitEdit()
  }

  const onEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      cancelEdit()
    }
  }

  return (
    <li className={`todo-item${todo.completed ? " done" : ""}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => updateTodo({ id: todo.id, completed: !todo.completed })}
        aria-label={`完成 ${todo.title}`}
      />

      {editing
        ? (
          <form className="todo-edit" onSubmit={onEditSubmit}>
            <input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={onEditKeyDown}
              onBlur={commitEdit}
              aria-label="编辑 Todo 标题"
              autoFocus
            />
          </form>
        )
        : (
          <button type="button" className="todo-title-button" onDoubleClick={startEdit}>
            <span className="todo-title">{todo.title}</span>
          </button>
        )}

      <div className="todo-actions">
        {!editing && (
          <button type="button" className="ghost" onClick={startEdit}>
            编辑
          </button>
        )}
        <button
          type="button"
          className="ghost danger"
          onClick={() => removeTodo(todo.id)}
        >
          删除
        </button>
      </div>
    </li>
  )
}

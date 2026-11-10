import type { Todo } from "@ets/domain"
import { createFileRoute } from "@tanstack/react-router"
import { type FormEvent, useEffect, useState, useTransition } from "react"
import { api } from "../lib/api.ts"

export const Route = createFileRoute("/")({
  component: TodosPage
})

function TodosPage() {
  const [todos, setTodos] = useState<ReadonlyArray<Todo>>([])
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, startTransition] = useTransition()

  const refresh = () =>
    startTransition(async () => {
      try {
        const [items, health] = await Promise.all([api.listTodos(), api.health()])
        setTodos(items)
        setReady(health.status === "ok")
        setError(null)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    })

  useEffect(() => {
    refresh()
  }, [])

  const onCreate = (event: FormEvent) => {
    event.preventDefault()
    const next = title.trim()
    if (!next) return
    startTransition(async () => {
      try {
        await api.createTodo(next)
        setTitle("")
        await refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    })
  }

  return (
    <>
      <h1 className="brand">effect-t-stack</h1>
      <p className="lede">
        Effect v4 HttpApi 金样基础模板。共享 protocol 契约，服务端 Layers 组装，前端 TanStack Router
        调用同源类型客户端。
      </p>

      <section className="panel">
        <form className="composer" onSubmit={onCreate}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加一个 Todo…"
            aria-label="Todo title"
          />
          <button type="submit" disabled={pending}>
            添加
          </button>
        </form>

        <ul className="todo-list">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`todo-item${todo.completed ? " done" : ""}`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() =>
                  startTransition(async () => {
                    await api.updateTodo(todo.id, {
                      completed: !todo.completed
                    })
                    await refresh()
                  })}
                aria-label={`完成 ${todo.title}`}
              />
              <span className="todo-title">{todo.title}</span>
              <div className="todo-actions">
                <button
                  type="button"
                  className="ghost danger"
                  onClick={() =>
                    startTransition(async () => {
                      await api.removeTodo(todo.id)
                      await refresh()
                    })}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>

        <p className={`status${error ? " error" : ""}`}>
          {error
            ? `API 错误：${error}`
            : ready
            ? pending
              ? "同步中…"
              : `已连接 · ${todos.length} 条 Todo`
            : "连接服务器中…"}
        </p>
      </section>
    </>
  )
}

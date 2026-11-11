import type { Todo, TodoId } from "@ets/domain"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { type FormEvent, useState, useTransition } from "react"
import { api } from "../lib/api.ts"

type HomeLoaderData = {
  readonly todos: ReadonlyArray<Todo>
  readonly ready: boolean
  readonly loadError: string | null
}

export const Route = createFileRoute("/")({
  loader: async (): Promise<HomeLoaderData> => {
    try {
      await api.ready()
      const todos = await api.listTodos()
      return { todos, ready: true, loadError: null }
    } catch (cause) {
      return {
        todos: [],
        ready: false,
        loadError: cause instanceof Error ? cause.message : String(cause)
      }
    }
  },
  component: TodosPage
})

function TodosPage() {
  const { todos, ready, loadError } = Route.useLoaderData()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(loadError)
  const [pending, startTransition] = useTransition()

  const runMutation = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      try {
        await action()
        await router.invalidate()
        setError(null)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    })
  }

  const onCreate = (event: FormEvent) => {
    event.preventDefault()
    const next = title.trim()
    if (!next) return
    runMutation(async () => {
      await api.createTodo(next)
      setTitle("")
    })
  }

  const onToggle = (id: TodoId, completed: boolean) => {
    runMutation(() => api.updateTodo(id, { completed: !completed }))
  }

  const onRemove = (id: TodoId) => {
    runMutation(() => api.removeTodo(id))
  }

  return (
    <>
      <h1 className="brand">effect-t-stack</h1>
      <p className="lede">
        Effect v4 HttpApi 金样基础模板。共享 protocol 契约，HttpApi 由 TanStack Start 同源托管，前端调用类型客户端。
      </p>

      <section className="panel">
        <form className="composer" onSubmit={onCreate}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加一个 Todo…"
            aria-label="Todo title"
            disabled={!ready || pending}
          />
          <button type="submit" disabled={!ready || pending}>
            添加
          </button>
        </form>

        {todos.length === 0
          ? (
            <p className="empty-state">
              {ready ? "还没有 Todo，添加第一条吧。" : "无法加载 Todo 列表。"}
            </p>
          )
          : (
            <ul className="todo-list">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`todo-item${todo.completed ? " done" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => onToggle(todo.id, todo.completed)}
                    disabled={pending}
                    aria-label={`完成 ${todo.title}`}
                  />
                  <span className="todo-title">{todo.title}</span>
                  <div className="todo-actions">
                    <button
                      type="button"
                      className="ghost danger"
                      onClick={() => onRemove(todo.id)}
                      disabled={pending}
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

        <p className={`status${error ? " error" : ""}`}>
          {error
            ? `API 错误：${error}`
            : ready
            ? pending
              ? "同步中…"
              : `已就绪 · ${todos.length} 条 Todo`
            : "服务未就绪…"}
        </p>
      </section>
    </>
  )
}

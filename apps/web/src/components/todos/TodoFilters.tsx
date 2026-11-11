import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react"
import { clearCompletedAtom } from "../../atoms/todos.ts"
import { filterAtom, searchAtom, todoCountsAtom, type TodoFilter } from "../../atoms/todosUi.ts"

const filters: ReadonlyArray<{ readonly id: TodoFilter; readonly label: string }> = [
  { id: "all", label: "全部" },
  { id: "active", label: "未完成" },
  { id: "completed", label: "已完成" }
]

export function TodoFilters() {
  const [filter, setFilter] = useAtom(filterAtom)
  const [search, setSearch] = useAtom(searchAtom)
  const counts = useAtomValue(todoCountsAtom)
  const clearCompleted = useAtomSet(clearCompletedAtom)

  return (
    <div className="todo-toolbar">
      <div className="todo-filters" role="tablist" aria-label="Todo 筛选">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`todo-filter${filter === item.id ? " active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <input
        className="todo-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索标题…"
        aria-label="搜索 Todo"
      />

      <div className="todo-toolbar-meta">
        <span className="todo-counts">
          {counts.active} 未完成 · {counts.completed} 已完成
        </span>
        <button
          type="button"
          className="ghost"
          disabled={counts.completed === 0}
          onClick={() => clearCompleted(undefined)}
        >
          清除已完成
        </button>
      </div>
    </div>
  )
}

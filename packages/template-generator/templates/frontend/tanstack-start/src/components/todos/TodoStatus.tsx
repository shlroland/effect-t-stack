import { useAtomValue } from "@effect/atom-react"
import { todosSyncingAtom } from "../../atoms/todos.ts"
import { todoCountsAtom } from "../../atoms/todosUi.ts"

export function TodoStatus() {
  const syncing = useAtomValue(todosSyncingAtom)
  const counts = useAtomValue(todoCountsAtom)

  return (
    <p className="status">
      {syncing ? "同步中…" : `已就绪 · ${counts.total} 条 Todo`}
    </p>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { TodosAsyncView } from "../components/todos/TodosAsyncView.tsx"

export const Route = createFileRoute("/")({
  component: TodosPage
})

function TodosPage() {
  return (
    <>
      <h1 className="brand">effect-t-stack</h1>
      <p className="lede">
        Effect v4 HttpApi 金样基础模板。共享 protocol 契约，HttpApi 由 TanStack Start 同源托管，前端用 Effect Atom
        管理远程与本地状态。
      </p>

      <section className="panel">
        <TodosAsyncView />
      </section>
    </>
  )
}

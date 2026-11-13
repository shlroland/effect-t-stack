import { HydrationBoundary } from "@effect/atom-react"
import { createFileRoute } from "@tanstack/react-router"
import type { Hydration } from "effect/reactivity"
import { dehydrateTodosListPromise } from "../atoms/dehydrateTodos.ts"
import { TodosAsyncView } from "../components/todos/TodosAsyncView.tsx"

type HomeLoaderData = {
  readonly dehydratedAtoms: ReadonlyArray<Hydration.DehydratedAtom>
}

export const Route = createFileRoute("/")({
  loader: async (): Promise<HomeLoaderData> => {
    try {
      return { dehydratedAtoms: await dehydrateTodosListPromise() }
    } catch {
      return { dehydratedAtoms: [] }
    }
  },
  component: TodosPage
})

function TodosPage() {
  const { dehydratedAtoms } = Route.useLoaderData()

  return (
    <>
      <h1 className="brand">effect-t-stack</h1>
      <p className="lede">
        Effect v4 金样：默认 API primary 为 Rpc（`/rpc`），HttpApi（`/api`，OpenAPI）为 secondary。Todo UI 用
        AtomRpc；Start loader 预热 Atom 再注水，React 只订阅与分发。
      </p>

      <section className="panel">
        <HydrationBoundary state={dehydratedAtoms}>
          <TodosAsyncView />
        </HydrationBoundary>
      </section>
    </>
  )
}

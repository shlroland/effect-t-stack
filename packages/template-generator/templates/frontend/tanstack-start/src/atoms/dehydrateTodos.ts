import { Effect } from "effect"
import { AtomRegistry, Hydration } from "effect/reactivity"
import { todosQueryAtom } from "./todos.ts"

/**
 * Prefetch the todos list query in a throwaway registry and dehydrate
 * serializable atom state for TanStack Start → HydrationBoundary.
 */
export const dehydrateTodosList = Effect.fnUntraced(function*() {
  const registry = AtomRegistry.make()
  yield* Effect.addFinalizer(() => Effect.sync(() => registry.dispose()))
  yield* Effect.exit(
    AtomRegistry.getResult(registry, todosQueryAtom, { suspendOnWaiting: true })
  )
  return Hydration.dehydrate(registry)
})

export const dehydrateTodosListPromise = (): Promise<Array<Hydration.DehydratedAtom>> =>
  Effect.runPromise(Effect.scoped(dehydrateTodosList()))

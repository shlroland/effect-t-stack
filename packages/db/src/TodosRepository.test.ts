import { TodoTitle } from "@ets/domain"
import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { Database } from "./Database.ts"
import { Migrations } from "./Migrations.ts"
import { TodosRepository } from "./TodosRepository.ts"

const TestLive = (() => {
  const url = `:memory:`
  const DatabaseLive = Database.layer(url)
  const MigrationsLive = Migrations.layer().pipe(Layer.provide(DatabaseLive))
  const RepoLive = TodosRepository.layerNoDeps.pipe(Layer.provide(DatabaseLive))
  return Layer.mergeAll(DatabaseLive, MigrationsLive, RepoLive)
})()

describe("TodosRepository", () => {
  it("persists todos in SQLite", async () => {
    const result = await Effect.gen(function*() {
      const repo = yield* TodosRepository
      const created = yield* repo.create(TodoTitle.make("persist me"))
      const found = yield* repo.findById(created.id)
      const all = yield* repo.all()
      const updated = yield* repo.update(created.id, { completed: true })
      const removed = yield* repo.remove(created.id)
      const after = yield* repo.findById(created.id)
      return { created, found, all, updated, removed, after }
    }).pipe(
      Effect.provide(TestLive),
      Effect.scoped,
      Effect.runPromise
    )

    expect(String(result.created.title)).toBe("persist me")
    expect(result.found?.id).toBe(result.created.id)
    expect(result.all).toHaveLength(1)
    expect(result.updated?.completed).toBe(true)
    expect(result.removed).toBe(true)
    expect(result.after).toBeUndefined()
  })
})

import { TodoId, TodoTitle } from "@ets/domain"
import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { TodosRepository } from "../TodosRepository.ts"
import { Database } from "./Database.ts"
import { Migrations } from "./Migrations.ts"
import { layerNoDeps } from "./TodosRepository.ts"

const TestLive = (() => {
  const url = `:memory:`
  const DatabaseLive = Database.layer(url)
  const MigrationsLive = Migrations.layer().pipe(Layer.provide(DatabaseLive))
  const RepoLive = layerNoDeps.pipe(Layer.provide(DatabaseLive))
  return Layer.mergeAll(DatabaseLive, MigrationsLive, RepoLive)
})()

describe("TodosRepository (effect-sql)", () => {
  it("persists todos in SQLite via Effect SQL", async () => {
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

  it("returns undefined / false for missing rows", async () => {
    const result = await Effect.gen(function*() {
      const repo = yield* TodosRepository
      const missingId = TodoId.make(99)
      const found = yield* repo.findById(missingId)
      const updated = yield* repo.update(missingId, { completed: true })
      const removed = yield* repo.remove(missingId)
      return { found, updated, removed }
    }).pipe(
      Effect.provide(TestLive),
      Effect.scoped,
      Effect.runPromise
    )

    expect(result.found).toBeUndefined()
    expect(result.updated).toBeUndefined()
    expect(result.removed).toBe(false)
  })

  it("does not apply empty-patch business rule (Service owns that)", async () => {
    const result = await Effect.gen(function*() {
      const repo = yield* TodosRepository
      const created = yield* repo.create(TodoTitle.make("empty patch"))
      const updated = yield* repo.update(created.id, {})
      return { created, updated }
    }).pipe(
      Effect.provide(TestLive),
      Effect.scoped,
      Effect.runPromise
    )

    expect(result.updated).toBeUndefined()
    expect(result.created.id).toBeDefined()
  })
})

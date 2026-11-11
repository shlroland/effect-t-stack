import { BunHttpServer } from "@effect/platform-bun"
import { TodoTitle } from "@ets/domain"
import { Api } from "@ets/protocol/http-api"
import { afterAll, describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { HttpApiTest } from "effect/http-api"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { SystemApiHandlers } from "./http/System/http.ts"
import { TodosApiHandlers } from "./http/Todos/http.ts"
import { makeAppLive } from "./layers.ts"

const tempDir = mkdtempSync(join(tmpdir(), "ets-app-live-"))
const databaseUrl = join(tempDir, "integration.sqlite")

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

const AppHandlersLive = Layer.mergeAll(SystemApiHandlers, TodosApiHandlers).pipe(
  Layer.provide(makeAppLive({ databaseUrl }))
)

describe("makeAppLive integration", () => {
  it("runs migrations, readiness, and Todo CRUD against real SQLite", async () => {
    await Effect.gen(function*() {
      // system is topLevel (flattened); todos stays under `client.todos`
      const client = yield* HttpApiTest.groups(Api, ["system", "todos"])

      const health = yield* client.health({})
      expect(health.status).toBe("ok")

      const ready = yield* client.ready({})
      expect(ready.status).toBe("ready")

      const created = yield* client.todos.create({
        payload: { title: TodoTitle.make("integration") }
      })
      expect(String(created.title)).toBe("integration")

      const listed = yield* client.todos.list({})
      expect(listed.some((todo) => todo.id === created.id)).toBe(true)

      yield* client.todos.remove({ params: { id: created.id } })
    }).pipe(
      Effect.provide(Layer.mergeAll(AppHandlersLive, BunHttpServer.layerTest)),
      Effect.scoped,
      Effect.runPromise
    )
  })
})

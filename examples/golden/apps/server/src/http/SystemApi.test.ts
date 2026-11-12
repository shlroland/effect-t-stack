import { BunHttpServer } from "@effect/platform-bun"
import { DatabaseError } from "@ets/db"
import { Api } from "@ets/protocol/http-api"
import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { HttpApiError, HttpApiTest } from "effect/http-api"
import { System } from "../services/System.ts"
import { SystemApiHandlers } from "./System/http.ts"

const SystemOkLive = Layer.succeed(
  System,
  System.of({
    health: () => Effect.void,
    ready: () => Effect.void
  })
)

const SystemUnavailableLive = Layer.succeed(
  System,
  System.of({
    health: () => Effect.void,
    ready: () =>
      Effect.fail(
        new DatabaseError({ operation: "database.ping", cause: "unavailable" })
      )
  })
)

describe("System HTTP API", () => {
  it("returns health and ready", async () => {
    await Effect.gen(function*() {
      // system group is topLevel — endpoints are flattened onto the client
      const client = yield* HttpApiTest.groups(Api, ["system"])
      const health = yield* client.health({})
      const ready = yield* client.ready({})
      expect(health.status).toBe("ok")
      expect(ready.status).toBe("ready")
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          SystemApiHandlers.pipe(Layer.provide(SystemOkLive)),
          BunHttpServer.layerTest
        )
      ),
      Effect.scoped,
      Effect.runPromise
    )
  })

  it("maps readiness DatabaseError to ServiceUnavailable", async () => {
    await Effect.gen(function*() {
      const client = yield* HttpApiTest.groups(Api, ["system"])
      const error = yield* client.ready({}).pipe(Effect.flip)
      expect(error).toBeInstanceOf(HttpApiError.ServiceUnavailable)
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          SystemApiHandlers.pipe(Layer.provide(SystemUnavailableLive)),
          BunHttpServer.layerTest
        )
      ),
      Effect.scoped,
      Effect.runPromise
    )
  })
})

import { type DatabaseError, Migrations } from "@ets/db"
import { HealthResponse, ReadyResponse } from "@ets/domain"
import { Context, Effect, Layer } from "effect"

export class System extends Context.Service<System, {
  readonly health: () => Effect.Effect<HealthResponse>
  readonly ready: () => Effect.Effect<ReadyResponse, DatabaseError>
}>()("@ets/server/System") {
  static readonly layerNoDeps = Layer.effect(
    System,
    Effect.gen(function*() {
      const migrations = yield* Migrations

      return System.of({
        health: () => Effect.succeed(new HealthResponse({ status: "ok" })),
        ready: () =>
          migrations.ready.pipe(
            Effect.as(new ReadyResponse({ status: "ready" }))
          )
      })
    })
  )
}

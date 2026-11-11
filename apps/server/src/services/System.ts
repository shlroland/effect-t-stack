import { type DatabaseError, Migrations } from "@ets/db"
import { Context, Effect, Layer } from "effect"

/**
 * Ops readiness — returns unit; wire DTOs are mapped in HttpApi / Rpc handlers
 * (aligned with Effect fixtures where system health is transport-shaped).
 */
export class System extends Context.Service<System, {
  readonly health: () => Effect.Effect<void>
  readonly ready: () => Effect.Effect<void, DatabaseError>
}>()("@ets/server/System") {
  static readonly layerNoDeps = Layer.effect(
    System,
    Effect.gen(function*() {
      const migrations = yield* Migrations

      return System.of({
        health: () => Effect.void,
        ready: () => migrations.ready
      })
    })
  )
}

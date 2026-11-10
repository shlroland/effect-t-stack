import { Database, Migrations } from "@ets/db"
import { HealthResponse, ReadyResponse } from "@ets/domain"
import { Api } from "@ets/protocol"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { mapReadinessError } from "./Errors.ts"

export const SystemApiHandlers = HttpApiBuilder.group(
  Api,
  "system",
  Effect.fn(function*(handlers) {
    const database = yield* Database
    const migrations = yield* Migrations

    return handlers
      .handle("health", () => Effect.succeed(new HealthResponse({ status: "ok" })))
      .handle("ready", () =>
        mapReadinessError(
          migrations.ready.pipe(
            Effect.andThen(database.ping),
            Effect.as(new ReadyResponse({ status: "ready" }))
          )
        ))
  })
)

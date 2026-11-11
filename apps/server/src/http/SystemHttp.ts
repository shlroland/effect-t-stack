import { Migrations } from "@ets/db"
import { HealthResponse, ReadyResponse } from "@ets/domain"
import { Api } from "@ets/protocol"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { mapReadinessError } from "./Errors.ts"

export const SystemApiHandlers = HttpApiBuilder.group(
  Api,
  "system",
  Effect.fn(function*(handlers) {
    const migrations = yield* Migrations

    return handlers
      .handle("health", () => Effect.succeed(new HealthResponse({ status: "ok" })))
      .handle("ready", () =>
        mapReadinessError(
          migrations.ready.pipe(
            Effect.as(new ReadyResponse({ status: "ready" }))
          )
        ))
  })
)

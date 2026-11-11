import { Api } from "@ets/protocol/http-api"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { System } from "../services/System.ts"
import { mapReadinessError } from "./Errors.ts"

export const SystemApiHandlers = HttpApiBuilder.group(
  Api,
  "system",
  Effect.fn("SystemHttp")(function*(handlers) {
    const system = yield* System

    return handlers
      .handle(
        "health",
        Effect.fn("SystemHttp.health")(function*() {
          return yield* system.health()
        })
      )
      .handle(
        "ready",
        Effect.fn("SystemHttp.ready")(function*() {
          return yield* system.ready().pipe(mapReadinessError)
        })
      )
  })
)

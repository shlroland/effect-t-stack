import { Api } from "@ets/protocol"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { System } from "../services/System.ts"
import { mapReadinessError } from "./Errors.ts"

export const SystemApiHandlers = HttpApiBuilder.group(
  Api,
  "system",
  Effect.fn(function*(handlers) {
    const system = yield* System

    return handlers
      .handle("health", () => system.health())
      .handle("ready", () => mapReadinessError(system.ready()))
  })
)

import type { DatabaseError, TodoDecodeError } from "@ets/db"
import { Effect } from "effect"
import { HttpApiError } from "effect/http-api"

const failInternal = (message: string, error: unknown) =>
  Effect.logError(message, error).pipe(
    Effect.andThen(Effect.fail(new HttpApiError.InternalServerError()))
  )

const failUnavailable = (message: string, error: unknown) =>
  Effect.logError(message, error).pipe(
    Effect.andThen(Effect.fail(new HttpApiError.ServiceUnavailable()))
  )

export const mapUnexpectedErrors = <A, E, R>(
  effect: Effect.Effect<A, E | DatabaseError | TodoDecodeError, R>
) =>
  effect.pipe(
    Effect.catchTag("DatabaseError", (error) => failInternal("database operation failed", error)),
    Effect.catchTag("TodoDecodeError", (error) => failInternal("persisted todo failed to decode", error))
  )

export const mapReadinessError = <A, E, R>(
  effect: Effect.Effect<A, E | DatabaseError, R>
) =>
  effect.pipe(
    Effect.catchTag("DatabaseError", (error) => failUnavailable("readiness check failed", error))
  )

import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api"
import { HealthResponse, ReadyResponse } from "../Health.ts"

/**
 * Top-level system group (mirrors Effect HttpApi fixtures naming: `SystemApi`).
 * Derived client exposes `client.health()` / `client.ready()`.
 */
export class SystemApi extends HttpApiGroup.make("system", { topLevel: true })
  .add(
    HttpApiEndpoint.get("health", "/health", {
      success: HealthResponse
    }),
    HttpApiEndpoint.get("ready", "/ready", {
      success: ReadyResponse,
      error: HttpApiError.ServiceUnavailableNoContent
    })
  )
{}

import { HealthResponse, ReadyResponse } from "@ets/domain"
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api"

export class SystemApiGroup extends HttpApiGroup.make("system", { topLevel: true })
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

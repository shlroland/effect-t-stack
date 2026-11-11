import { Api, ApiPrefix } from "@ets/protocol/http-api"
import { Layer } from "effect"
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api"
import { SystemApiHandlers } from "./System/http.ts"
import { TodosApiHandlers } from "./Todos/http.ts"

export const ApiRoutes = HttpApiBuilder.layer(Api, {
  openapiPath: `${ApiPrefix}/openapi.json`
}).pipe(
  Layer.provide([SystemApiHandlers, TodosApiHandlers])
)

export const DocsRoute = HttpApiScalar.layer(Api, {
  path: `${ApiPrefix}/docs`
})

/** HttpApi + Scalar docs (primary surface). */
export const HttpApiRoutes = Layer.mergeAll(ApiRoutes, DocsRoute)

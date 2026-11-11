import { Api, ApiPrefix } from "@ets/protocol/http-api"
import { Layer } from "effect"
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api"
import { SystemApiHandlers } from "./SystemHttp.ts"
import { TodosApiHandlers } from "./TodosHttp.ts"

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

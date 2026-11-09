import { Api } from "@ets/protocol"
import { Layer } from "effect"
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api"
import { SystemApiHandlers } from "./SystemHttp.ts"
import { TodosApiHandlers } from "./TodosHttp.ts"

export const ApiRoutes = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json"
}).pipe(
  Layer.provide([SystemApiHandlers, TodosApiHandlers])
)

export const DocsRoute = HttpApiScalar.layer(Api, {
  path: "/docs"
})

export const AllRoutes = Layer.mergeAll(ApiRoutes, DocsRoute)

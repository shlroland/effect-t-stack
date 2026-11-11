import { Api, ApiPrefix, AppRpcs, RpcPrefix } from "@ets/protocol"
import { Layer } from "effect"
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api"
import { RpcSerialization, RpcServer } from "effect/rpc"
import { AppRpcHandlers } from "../rpc/AppRpcHandlers.ts"
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

/** Secondary Effect Rpc surface (HTTP + NDJSON) under {@link RpcPrefix}. */
export const RpcRoutes = RpcServer.layerHttp({
  group: AppRpcs,
  path: RpcPrefix,
  protocol: "http"
}).pipe(
  Layer.provide(AppRpcHandlers),
  Layer.provide(RpcSerialization.layerNdjson)
)

export const AllRoutes = Layer.mergeAll(ApiRoutes, DocsRoute, RpcRoutes)

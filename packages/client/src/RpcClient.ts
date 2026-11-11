import { AppRpcs, RpcPrefix } from "@ets/protocol"
import { Context, Layer } from "effect"
import { FetchHttpClient } from "effect/http"
import { RpcClient, type RpcClientError, type RpcGroup, RpcSerialization } from "effect/rpc"

export class AppRpcClient extends Context.Service<
  AppRpcClient,
  RpcClient.RpcClient<RpcGroup.Rpcs<typeof AppRpcs>, RpcClientError.RpcClientError>
>()("@ets/client/AppRpcClient") {
  /**
   * HTTP + NDJSON client for {@link AppRpcs}.
   * @param baseUrl Origin only (e.g. `http://localhost:5173`); `/rpc` is appended.
   */
  static readonly layer = (baseUrl: string) =>
    Layer.effect(AppRpcClient, RpcClient.make(AppRpcs)).pipe(
      Layer.provide(
        RpcClient.layerProtocolHttp({
          url: `${baseUrl.replace(/\/$/, "")}${RpcPrefix}`
        })
      ),
      Layer.provide(FetchHttpClient.layer),
      Layer.provide(RpcSerialization.layerNdjson)
    )
}

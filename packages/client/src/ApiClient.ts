import { Api } from "@ets/protocol"
import { Context, Layer } from "effect"
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http"
import { HttpApiClient } from "effect/http-api"

export class ApiClient extends Context.Service<
  ApiClient,
  HttpApiClient.ForApi<typeof Api>
>()("@ets/client/ApiClient") {
  static readonly layer = (baseUrl: string) =>
    Layer.effect(
      ApiClient,
      HttpApiClient.make(Api, {
        transformClient: (client) =>
          client.pipe(
            HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl))
          )
      })
    ).pipe(Layer.provide(FetchHttpClient.layer))
}

import { Api } from "@ets/protocol/http-api"
import { FetchHttpClient } from "effect/http"
import { AtomHttpApi } from "effect/reactivity"

/** Same-origin by default (Start embeds HttpApi). Override for standalone `apps/server`. */
const baseUrl = import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")

export const ApiAtoms = AtomHttpApi.Service()("ApiAtoms", {
  api: Api,
  baseUrl,
  httpClient: FetchHttpClient.layer
})

export const todosReactivityKeys = ["todos"] as const

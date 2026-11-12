import { loadServerEnv, type MakeServerEnvProviderOptions } from "@ets/config"
import { RpcPrefix } from "@ets/protocol/rpc"
import { Layer } from "effect"
import { HttpMiddleware, HttpRouter, HttpServer } from "effect/http"
import { makeAppLive } from "../layers.ts"
import { RpcRoutes } from "./RpcApp.ts"

const withCors = HttpMiddleware.cors({
  allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  allowedMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
})

export type CreateRpcWebHandlerOptions = MakeServerEnvProviderOptions & {
  /** Enable CORS for cross-origin SPA clients (standalone Bun server). Same-origin Start mounts leave this off. */
  readonly cors?: boolean
  /** Share memoization with {@link createHttpApiWebHandler} when both are mounted. */
  readonly memoMap?: Layer.MemoMap
  /** Share AppLive with HttpApi so both surfaces use one DB / Services graph. */
  readonly appLive?: ReturnType<typeof makeAppLive>
}

/**
 * WinterCG `fetch` handler for Effect Rpc under {@link RpcPrefix} (`/rpc`).
 */
export const createRpcWebHandler = (options?: CreateRpcWebHandlerOptions) => {
  const env = loadServerEnv(options)
  const appLive = options?.appLive ?? makeAppLive({
    databaseUrl: env.DATABASE_URL,
    port: env.PORT
  })
  const RoutesLive = RpcRoutes.pipe(
    Layer.provide(appLive),
    Layer.provide(HttpServer.layerServices)
  )

  return HttpRouter.toWebHandler(RoutesLive, {
    ...(options?.cors === true ? { middleware: withCors } : {}),
    ...(options?.memoMap !== undefined ? { memoMap: options.memoMap } : {})
  })
}

export const isRpcRequestPath = (pathname: string): boolean =>
  pathname === RpcPrefix || pathname.startsWith(`${RpcPrefix}/`)

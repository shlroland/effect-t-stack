import { loadServerEnv, type MakeServerEnvProviderOptions } from "@ets/config"
import { ApiPrefix } from "@ets/protocol"
import { Layer } from "effect"
import { HttpMiddleware, HttpRouter, HttpServer } from "effect/http"
import { AllRoutes } from "./http/HttpApp.ts"
import { makeAppLive } from "./layers.ts"

const withCors = HttpMiddleware.cors({
  allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  allowedMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
})

export type CreateApiWebHandlerOptions = MakeServerEnvProviderOptions & {
  /** Enable CORS for cross-origin SPA clients (standalone Bun server). Same-origin Start mounts leave this off. */
  readonly cors?: boolean
}

/**
 * Build a WinterCG `fetch` handler from the shared HttpApi Layers.
 * Used by TanStack Start (primary) and can be reused by other adapters.
 */
export const createApiWebHandler = (options?: CreateApiWebHandlerOptions) => {
  const env = loadServerEnv(options)
  const RoutesLive = AllRoutes.pipe(
    Layer.provide(makeAppLive({
      databaseUrl: env.DATABASE_URL,
      port: env.PORT
    })),
    Layer.provide(HttpServer.layerServices)
  )

  return HttpRouter.toWebHandler(
    RoutesLive,
    options?.cors === true ? { middleware: withCors } : undefined
  )
}

/** All Effect HttpApi traffic lives under {@link ApiPrefix}. */
export const isApiRequestPath = (pathname: string): boolean =>
  pathname === ApiPrefix || pathname.startsWith(`${ApiPrefix}/`)

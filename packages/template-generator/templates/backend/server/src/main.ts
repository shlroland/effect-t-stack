/**
 * Secondary standalone Bun server template.
 * The default app embeds HttpApi + Rpc via TanStack Start (`apps/web/src/server.ts`).
 */
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import { HttpMiddleware, HttpRouter } from "effect/http"
import { AppConfig } from "./config/AppConfig.ts"
import { HttpApiRoutes } from "./http/HttpApp.ts"
import { AppLive } from "./layers.ts"
import { RpcRoutes } from "./rpc/RpcApp.ts"

const RoutesLive = Layer.mergeAll(HttpApiRoutes, RpcRoutes).pipe(Layer.provide(AppLive))

const ServerLive = Layer.unwrap(
  Effect.gen(function*() {
    const { port } = yield* AppConfig
    return BunHttpServer.layer({ port })
  })
).pipe(Layer.provide(AppConfig.layer))

const HttpLive = Layer.unwrap(
  Effect.gen(function*() {
    const { corsOrigins } = yield* AppConfig
    return HttpRouter.serve(RoutesLive, {
      middleware: HttpMiddleware.cors({
        allowedOrigins: [...corsOrigins],
        allowedMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"]
      })
    })
  })
).pipe(
  Layer.provide(ServerLive),
  Layer.provide(AppConfig.layer)
)

BunRuntime.runMain(Layer.launch(HttpLive))

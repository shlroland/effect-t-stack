import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import { HttpMiddleware, HttpRouter } from "effect/http"
import { AppConfig } from "./config/AppConfig.ts"
import { AllRoutes } from "./http/HttpApp.ts"
import { AppLive } from "./layers.ts"

const withCors = HttpMiddleware.cors({
  allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  allowedMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
})

const RoutesLive = AllRoutes.pipe(Layer.provide(AppLive))

const ServerLive = Layer.unwrap(
  Effect.gen(function*() {
    const { port } = yield* AppConfig
    return BunHttpServer.layer({ port })
  })
).pipe(Layer.provide(AppConfig.layer))

const HttpLive = HttpRouter.serve(RoutesLive, {
  middleware: withCors
}).pipe(Layer.provide(ServerLive))

BunRuntime.runMain(Layer.launch(HttpLive))

import { Config, Context, Effect, Layer } from "effect"

export class AppConfig extends Context.Service<AppConfig, {
  readonly databaseUrl: string
  readonly port: number
}>()("@ets/server/AppConfig") {
  static readonly layerFrom = (config: {
    readonly databaseUrl: string
    readonly port?: number
  }) =>
    Layer.succeed(
      AppConfig,
      AppConfig.of({
        databaseUrl: config.databaseUrl,
        port: config.port ?? 3737
      })
    )

  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function*() {
      const databaseUrl = yield* Config.String("DATABASE_URL").pipe(
        Config.withDefault("./data.db")
      )
      const port = yield* Config.Port("PORT").pipe(
        Config.withDefault(3737)
      )
      return AppConfig.of({ databaseUrl, port })
    })
  )
}

import { Database, Migrations, TodosRepository } from "@ets/db"
import { Effect, Layer } from "effect"
import { AppConfig } from "./config/AppConfig.ts"
import { Todos } from "./services/Todos.ts"

export const makeAppLive = (config: {
  readonly databaseUrl: string
  readonly port?: number
}) => {
  const AppConfigLive = AppConfig.layerFrom(config)
  const DatabaseLive = Database.layer(config.databaseUrl)
  const MigrationsLive = Migrations.layer().pipe(Layer.provide(DatabaseLive))
  const TodosRepositoryLive = TodosRepository.layerNoDeps.pipe(
    Layer.provide(DatabaseLive)
  )
  const TodosLive = Todos.layerNoDeps.pipe(Layer.provide(TodosRepositoryLive))

  return Layer.mergeAll(
    AppConfigLive,
    DatabaseLive,
    MigrationsLive,
    TodosRepositoryLive,
    TodosLive
  )
}

export const AppLive = Layer.unwrap(
  Effect.gen(function*() {
    const config = yield* AppConfig
    return makeAppLive(config)
  })
).pipe(Layer.provide(AppConfig.layer))

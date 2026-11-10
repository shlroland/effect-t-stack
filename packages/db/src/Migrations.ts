import { migrate } from "drizzle-orm/effect-sqlite-bun/migrator"
import { Context, Effect, Layer } from "effect"
import { fileURLToPath } from "node:url"
import { Database, mapDatabaseError } from "./Database.ts"

const defaultMigrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url))

export class Migrations extends Context.Service<Migrations, {
  readonly ready: Effect.Effect<void>
}>()("@ets/db/Migrations") {
  static readonly layer = (migrationsFolder = defaultMigrationsFolder) =>
    Layer.effect(
      Migrations,
      Effect.gen(function*() {
        const db = yield* Database

        yield* mapDatabaseError(
          "migrations.run",
          migrate(db, { migrationsFolder })
        )

        return Migrations.of({
          ready: Effect.void
        })
      })
    )
}

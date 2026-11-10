import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { Context, Effect, Layer } from "effect"
import { fileURLToPath } from "node:url"
import { Database } from "./Database.ts"

const defaultMigrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url))

export class Migrations extends Context.Service<Migrations, {
  readonly ready: Effect.Effect<void>
}>()("@ets/db/Migrations") {
  static readonly layer = (migrationsFolder = defaultMigrationsFolder) =>
    Layer.effect(
      Migrations,
      Effect.gen(function*() {
        const database = yield* Database

        yield* database.use("migrations.run", (db) => migrate(db, { migrationsFolder }))

        return Migrations.of({
          ready: Effect.void
        })
      })
    )
}

import { BunFileSystem, BunPath } from "@effect/platform-bun"
import * as SqliteMigrator from "@effect/sql-sqlite-bun/SqliteMigrator"
import { Context, Effect, Layer, Path } from "effect"
import { SqlClient } from "effect/sql"
import { type DatabaseError, mapDatabaseError } from "../Database.ts"

const PlatformLive = Layer.mergeAll(BunFileSystem.layer, BunPath.layer)

const resolveDefaultMigrationsFolder = Effect.gen(function*() {
  const path = yield* Path.Path
  const modulePath = yield* path.fromFileUrl(new URL(import.meta.url))
  return path.join(path.dirname(modulePath), "..", "..", "effect-sql-migrations")
}).pipe(Effect.orDie)

export class Migrations extends Context.Service<Migrations, {
  readonly ready: Effect.Effect<void, DatabaseError>
}>()("@ets/db/effect-sql/Migrations") {
  static readonly layerFrom = (migrationsFolder?: string) =>
    Layer.effect(
      Migrations,
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        const folder = migrationsFolder ?? (yield* resolveDefaultMigrationsFolder)

        yield* mapDatabaseError(
          "migrations.run",
          SqliteMigrator.run({
            loader: SqliteMigrator.fromFileSystem(folder)
          })
        )

        return Migrations.of({
          ready: mapDatabaseError("database.ping", sql`select 1`).pipe(Effect.asVoid)
        })
      })
    ).pipe(Layer.provide(PlatformLive))

  static readonly layer = () => this.layerFrom()
}

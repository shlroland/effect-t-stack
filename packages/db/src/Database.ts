import * as SqliteClient from "@effect/sql-sqlite-bun/SqliteClient"
import * as SqliteDrizzle from "drizzle-orm/effect-sqlite-bun"
import { Context, Effect, Layer, Schema } from "effect"

export type AppDatabase = SqliteDrizzle.EffectSQLiteBunDatabase & {
  readonly $client: SqliteClient.SqliteClient
}

export class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", {
  operation: Schema.String,
  cause: Schema.Unknown
}) {}

export const mapDatabaseError = <A, E, R>(
  operation: string,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, DatabaseError, R> =>
  effect.pipe(
    Effect.mapError((cause) => new DatabaseError({ operation, cause }))
  )

export const ping = (db: AppDatabase): Effect.Effect<void, DatabaseError> =>
  mapDatabaseError("database.ping", db.run("select 1")).pipe(Effect.asVoid)

export class Database extends Context.Service<Database, AppDatabase>()("@ets/db/Database") {
  static readonly layer = (filename: string) =>
    Layer.effect(Database, SqliteDrizzle.makeWithDefaults()).pipe(
      Layer.provide(SqliteClient.layer({ filename })),
      Layer.orDie
    )
}

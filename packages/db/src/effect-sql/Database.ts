import * as SqliteClient from "@effect/sql-sqlite-bun/SqliteClient"
import { Effect, Layer } from "effect"
import { SqlClient } from "effect/sql"
import { DatabaseError, mapDatabaseError } from "../Database.ts"

export { DatabaseError, mapDatabaseError }

export const ping: Effect.Effect<void, DatabaseError, SqlClient.SqlClient> = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* mapDatabaseError("database.ping", sql`select 1`)
}).pipe(Effect.asVoid)

/**
 * Secondary ORM option: Effect SQL via `@effect/sql-sqlite-bun`.
 * Provides both `SqliteClient` and `SqlClient`.
 */
export const Database = {
  layer: (filename: string) => SqliteClient.layer({ filename }).pipe(Layer.orDie)
} as const

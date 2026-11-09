import { Database as BunSqlite } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { Context, Effect, Layer, Schema } from "effect"

type Db = ReturnType<typeof drizzle>

export class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", {
  operation: Schema.String,
  cause: Schema.Unknown
}) {}

export class Database extends Context.Service<Database, {
  readonly use: <A>(
    operation: string,
    f: (db: Db) => A | Promise<A>
  ) => Effect.Effect<A, DatabaseError>
  readonly ping: Effect.Effect<void, DatabaseError>
}>()("@ets/db/Database") {
  static readonly layer = (databaseUrl: string) =>
    Layer.effect(
      Database,
      Effect.gen(function*() {
        const client = yield* Effect.acquireRelease(
          Effect.sync(() => new BunSqlite(databaseUrl)),
          (c) => Effect.sync(() => c.close())
        )
        const db = drizzle(client)

        const use = <A>(
          operation: string,
          f: (db: Db) => A | Promise<A>
        ): Effect.Effect<A, DatabaseError> =>
          Effect.tryPromise({
            try: () => Promise.resolve(f(db)),
            catch: (cause) => new DatabaseError({ operation, cause })
          })

        const ping = Effect.try({
          try: () => {
            client.query("select 1").get()
          },
          catch: (cause) => new DatabaseError({ operation: "database.ping", cause })
        })

        return Database.of({ use, ping })
      })
    )
}

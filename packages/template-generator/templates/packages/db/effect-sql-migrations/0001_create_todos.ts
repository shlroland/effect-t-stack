import { Effect } from "effect"
import { SqlClient } from "effect/sql"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`
    CREATE TABLE todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
    )
  `
})

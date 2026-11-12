import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`)
})

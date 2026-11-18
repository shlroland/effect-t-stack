import type { VirtualFsService } from "../core/virtual-fs.ts"
import type { ProjectConfig } from "../types.ts"

const SNAPSHOT_PATH = "packages/db/drizzle/20241027033320_init/snapshot.json"

const POSTGRES_SNAPSHOT = {
  version: "6",
  dialect: "postgresql",
  id: "00000000-0000-0000-0000-000000000002",
  prevId: "00000000-0000-0000-0000-000000000000",
  tables: {
    public: {
      todos: {
        name: "todos",
        schema: "",
        columns: {
          id: {
            name: "id",
            type: "serial",
            primaryKey: true,
            notNull: true
          },
          title: {
            name: "title",
            type: "text",
            primaryKey: false,
            notNull: true
          },
          completed: {
            name: "completed",
            type: "boolean",
            primaryKey: false,
            notNull: true,
            default: false
          },
          created_at: {
            name: "created_at",
            type: "timestamp with time zone",
            primaryKey: false,
            notNull: true,
            default: "now()"
          }
        },
        indexes: {},
        foreignKeys: {},
        compositePrimaryKeys: {},
        uniqueConstraints: {},
        checkConstraints: {},
        policies: {},
        isRLSEnabled: false
      }
    }
  },
  enums: {},
  schemas: {},
  sequences: {},
  roles: {},
  policies: {},
  views: {},
  _meta: {
    schemas: {},
    tables: {},
    columns: {}
  }
} as const

/** Rewrite drizzle snapshot dialect metadata after templates render. */
export const processDatabaseDialect = (vfs: VirtualFsService, config: ProjectConfig): void => {
  if (config.database !== "postgres" || !vfs.fileExists(SNAPSHOT_PATH)) return
  vfs.writeJson(SNAPSHOT_PATH, POSTGRES_SNAPSHOT)
}

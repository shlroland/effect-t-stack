import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import type { ProjectConfig } from "../types.ts"

/** Computed env files. `.env.example` stays a template; these are the files the app reads. */
export const processEnvVariables = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  if (config.database === "none") return
  const databaseUrl = config.database === "sqlite" ? "./data.db" : ""
  if (vfs.fileExists("apps/web/package.json")) {
    vfs.writeFile("apps/web/.env", `DATABASE_URL=${databaseUrl}\n`)
  }
  if (vfs.fileExists("apps/server/package.json")) {
    vfs.writeFile(
      "apps/server/.env",
      `PORT=3737\nDATABASE_URL=${databaseUrl}\nCORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173\n`
    )
  }
}

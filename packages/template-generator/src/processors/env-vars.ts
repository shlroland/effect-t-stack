import { randomBytes } from "node:crypto"

import type { VirtualFsService } from "../core/virtual-fs.ts"
import type { ProjectConfig } from "../types.ts"

const authEnvBlock = (config: ProjectConfig): string => {
  if (config.auth !== "better-auth") return ""
  const secret = randomBytes(32).toString("hex")
  return `AUTH_SECRET=${secret}\nBETTER_AUTH_URL=http://localhost:5173\n`
}

/** Computed env files. `.env.example` stays a template; these are the files the app reads. */
export const processEnvVariables = (vfs: VirtualFsService, config: ProjectConfig): void => {
  if (config.database === "none") return
  const databaseUrl = config.database === "postgres"
    ? "postgres://postgres:postgres@127.0.0.1:5432/ets"
    : "./data.db"
  const auth = authEnvBlock(config)
  if (vfs.fileExists("apps/web/package.json")) {
    vfs.writeFile("apps/web/.env", `DATABASE_URL=${databaseUrl}\n${auth}`)
  }
  if (vfs.fileExists("apps/server/package.json")) {
    vfs.writeFile(
      "apps/server/.env",
      `PORT=3737\nDATABASE_URL=${databaseUrl}\nCORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173\n${auth}`
    )
  }
}

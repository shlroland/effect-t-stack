import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import type { ProjectConfig } from "../types.ts"

/** README is generated from config. There is no `README.md.hbs` on the default path. */
export const processReadme = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  const lines = [
    `# ${config.projectName}`,
    "",
    "Effect v4 app created by create-effect-t-stack.",
    "",
    `- Runtime: ${config.runtime}`,
    `- API: ${config.api} primary, HttpApi secondary (\`/api\`)`,
    `- Database: ${config.database}`,
    `- ORM: ${config.orm}`,
    `- Auth: ${config.auth}`,
    `- Frontend: ${config.frontend.join(", ")}`,
    `- Backend: ${config.backend} (TanStack Start mounts Rpc and HttpApi)`,
    "",
    "## Scripts",
    "",
    "- `bun run dev` — TanStack Start",
    "- `bun run dev:server` — standalone Bun server",
    "- `bun run check` — lint, typecheck, and test",
    ""
  ]
  vfs.writeFile("README.md", lines.join("\n"))
}

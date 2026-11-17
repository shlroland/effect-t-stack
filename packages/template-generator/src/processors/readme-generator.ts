import type { VirtualFsService } from "../core/virtual-fs.ts"
import { hasAddon } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"

/** README is generated from config. There is no `README.md.hbs` on the default path. */
export const processReadme = (vfs: VirtualFsService, config: ProjectConfig): void => {
  const lines = [
    `# ${config.projectName}`,
    "",
    "Effect v4 app created by create-effect-t-stack.",
    "",
    `- Runtime: ${config.runtime}`,
    config.api === "httpapi"
      ? "- API: httpapi primary (`/api`), Rpc secondary (`/rpc`)"
      : "- API: rpc primary (`/rpc`), HttpApi secondary (`/api`)",
    `- Database: ${config.database}`,
    `- ORM: ${config.orm}`,
    `- Auth: ${config.auth}`,
    `- Frontend: ${config.frontend.join(", ")}`,
    `- Backend: ${config.backend} (TanStack Start mounts Rpc and HttpApi)`,
    ""
  ]
  if (hasAddon(config, "flake")) {
    lines.push(
      "## Nix (optional)",
      "",
      "- `nix develop` — Bun + Node LTS + pnpm/yarn via `flake.nix`",
      "- `nix develop -c $SHELL` — keep your login shell inside the flake env",
      ""
    )
  }
  lines.push(
    "## Scripts",
    "",
    "- `bun run dev` — TanStack Start",
    "- `bun run dev:server` — standalone Bun server",
    "- `bun run check` — lint, typecheck, and test",
    ""
  )
  vfs.writeFile("README.md", lines.join("\n"))
}

import type { VirtualFsService } from "../core/virtual-fs.ts"
import { hasAddon } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"
import { getPackageManagerConfig } from "../utils/package-manager.ts"

/** README is generated from config. There is no `README.md.hbs` on the default path. */
export const processReadme = (vfs: VirtualFsService, config: ProjectConfig): void => {
  const pm = getPackageManagerConfig(config.packageManager)
  const lines = [
    `# ${config.projectName}`,
    "",
    "Effect v4 app created by create-effect-t-stack.",
    "",
    `- Runtime: ${config.runtime}`,
    `- Package manager: ${config.packageManager}`,
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
    `- \`${pm.install}\` — install workspace dependencies`,
    `- \`${pm.run("dev")}\` — TanStack Start`,
    `- \`${pm.run("dev:server")}\` — standalone Bun server`,
    `- \`${pm.run("check")}\` — lint, typecheck, and test`,
    ""
  )
  if (config.runtime === "bun" && config.packageManager !== "bun") {
    lines.push(
      `Workspace package \`test\` / \`dev\` scripts still use the Bun runtime while \`runtime=bun\`.`,
      `Install Bun on PATH even when developing with ${config.packageManager}.`,
      ""
    )
  }
  vfs.writeFile("README.md", lines.join("\n"))
}

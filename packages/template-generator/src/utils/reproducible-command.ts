import type { ProjectConfig } from "../types.ts"

const runner = (config: ProjectConfig, version: string): string => {
  const spec = `create-effect-t-stack@${version}`
  switch (config.packageManager) {
    case "bun":
      return `bunx ${spec}`
    case "pnpm":
      return `pnpm dlx ${spec}`
    case "npm":
      return `npx ${spec}`
  }
}

/** `--yes` plus non-default Option Matrix flags that were selected. */
export const reproducibleCommand = (config: ProjectConfig, version: string): string => {
  const parts = [`${runner(config, version)} ${config.projectName}`, "--yes"]
  if (config.api !== "rpc") parts.push(`--api ${config.api}`)
  if (config.database !== "sqlite") parts.push(`--database ${config.database}`)
  if (config.auth !== "none") parts.push(`--auth ${config.auth}`)
  if (config.packageManager !== "bun") parts.push(`--package-manager ${config.packageManager}`)
  return parts.join(" ")
}

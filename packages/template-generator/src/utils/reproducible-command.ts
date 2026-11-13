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

/** `--yes` reproduces the default stack. Non-default flags land with later Option Matrix cells. */
export const reproducibleCommand = (config: ProjectConfig, version: string): string =>
  `${runner(config, version)} ${config.projectName} --yes`

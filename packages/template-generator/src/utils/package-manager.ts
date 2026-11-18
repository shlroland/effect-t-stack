import type { PackageManager } from "../types.ts"

/**
 * Package-manager install-tool surface (BTS `getPackageManagerConfig` analogue).
 * Runtime-bound scripts (`bun test`, `bun --hot`) stay elsewhere until `--runtime` expands.
 */
export type PackageManagerConfig = {
  readonly name: PackageManager
  /** `bun run <script>` / `npm run <script>` / `pnpm run <script>` */
  readonly run: (script: string) => string
  /** Filter one workspace package when turborepo is off. */
  readonly filter: (workspace: string, script: string) => string
  /** Recursive workspace run when turborepo is off. */
  readonly recursive: (script: string) => string
  /** One-shot package runner: `bunx` / `npx` / `pnpm dlx`. */
  readonly dlx: string
  /** Local bin runner: `bunx` / `npx` / `pnpm exec`. */
  readonly exec: string
  /** Install command for README / flake shellHook. */
  readonly install: string
}

export const getPackageManagerConfig = (pm: PackageManager): PackageManagerConfig => {
  switch (pm) {
    case "npm":
      return {
        name: "npm",
        run: (script) => `npm run ${script}`,
        filter: (workspace, script) => `npm run ${script} --workspace ${workspace} --`,
        recursive: (script) => `npm run ${script} --workspaces --if-present`,
        dlx: "npx",
        exec: "npx",
        install: "npm install"
      }
    case "pnpm":
      return {
        name: "pnpm",
        run: (script) => `pnpm run ${script}`,
        filter: (workspace, script) => `pnpm --filter ${workspace} ${script}`,
        recursive: (script) => script === "build" ? `pnpm -r --if-present ${script}` : `pnpm -r ${script}`,
        dlx: "pnpm dlx",
        exec: "pnpm exec",
        install: "pnpm install"
      }
    case "bun":
      return {
        name: "bun",
        run: (script) => `bun run ${script}`,
        filter: (workspace, script) => `bun run --filter=${workspace} ${script}`,
        recursive: (script) => `bun run --filter='*' ${script}`,
        dlx: "bunx",
        exec: "bunx",
        install: "bun install"
      }
  }
}

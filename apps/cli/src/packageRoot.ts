import { fileURLToPath } from "node:url"

/**
 * `apps/cli` package root — works for both `src/*.ts` (dev) and `dist/*.js` (publish bundle).
 * Bundlers rewrite `import.meta.url` to the output chunk.
 */
export const cliPackageRoot = fileURLToPath(new URL("..", import.meta.url))

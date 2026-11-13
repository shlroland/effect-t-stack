import { GeneratorError } from "../types.ts"

/**
 * Single pin table for generated apps. Templates name dependencies; they do not hard-code versions.
 * Keep this aligned with `examples/golden/package.json` `workspaces.catalog` until golden is removed.
 *
 * Intentional lags (see docs/DEPENDENCY-CATALOG.md): TypeScript 6.x, `@effect/language-service` 0.87.5,
 * `drizzle-orm` / `drizzle-kit` 1.0.0-rc.5. `@effect/oxc` is vendored, not pinned here.
 */
export const dependencyVersionMap = {
  "@effect/atom-react": "^4.1.3",
  "@effect/language-service": "0.87.5",
  "@effect/platform-bun": "^4.1.3",
  "@effect/sql-sqlite-bun": "^4.1.3",
  "@oxlint/plugins": "^1.93.0",
  "@tanstack/react-router": "^1.170.46",
  "@tanstack/react-start": "^1.169.5",
  "@types/bun": "latest",
  "@types/node": "^26.6.6",
  "@types/react": "^19.3.0",
  "@types/react-dom": "^19.3.0",
  "@vitejs/plugin-react": "^6.3.0",
  "dprint": "^0.64.3",
  "drizzle-kit": "1.0.0-rc.5",
  "drizzle-orm": "1.0.0-rc.5",
  "effect": "^4.1.4",
  "lefthook": "^2.2.2",
  "oxlint": "^1.93.0",
  "react": "^19.3.1",
  "react-dom": "^19.3.1",
  "scheduler": "^0.26.0",
  "turbo": "^2.11.10",
  "typescript": "^6.0.3",
  "vite": "^8.3.8"
} as const

export type DependencyName = keyof typeof dependencyVersionMap

export const pinnedVersion = (name: string): string => {
  if (!Object.prototype.hasOwnProperty.call(dependencyVersionMap, name)) {
    throw new GeneratorError("dependencies", `No dependencyVersionMap pin for ${name}`)
  }
  return dependencyVersionMap[name as DependencyName]
}

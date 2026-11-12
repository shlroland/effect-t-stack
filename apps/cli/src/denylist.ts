/** Paths (relative to golden root) that must never ship into generated apps. */
export const COPY_DENY_NAMES = new Set([
  "node_modules",
  ".git",
  ".turbo",
  "dist",
  "coverage",
  ".DS_Store",
  "repos",
  ".cursor",
  "data.db",
  "data.db-shm",
  "data.db-wal"
])

export const COPY_DENY_SUFFIXES = [
  ".db",
  ".db-shm",
  ".db-wal",
  ".tsbuildinfo",
  ".log"
] as const

export const isDeniedName = (name: string): boolean => {
  if (COPY_DENY_NAMES.has(name)) {
    return true
  }
  if (name.startsWith(".env") && name !== ".env.example") {
    return true
  }
  return COPY_DENY_SUFFIXES.some((suffix) => name.endsWith(suffix))
}

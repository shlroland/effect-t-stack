/** Force a VFS path to an absolute posix path (`/…`). */
export const toAbsolute = (input: string): string => {
  const normalized = input.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "")
  if (normalized.length === 0 || normalized === "/") return "/"
  return normalized.startsWith("/") ? normalized : `/${normalized}`
}

/** Store and return paths relative to the VFS root (no leading slash). */
export const toRelative = (absolute: string): string => absolute.replace(/^\/+/, "")

export const dirnamePosix = (absolute: string): string => {
  const normalized = absolute.replace(/\/+$/, "")
  const index = normalized.lastIndexOf("/")
  if (index <= 0) return "/"
  return normalized.slice(0, index)
}

export const basenamePosix = (path: string): string => {
  const normalized = path.replace(/\/+$/, "")
  const index = normalized.lastIndexOf("/")
  return index === -1 ? normalized : normalized.slice(index + 1)
}

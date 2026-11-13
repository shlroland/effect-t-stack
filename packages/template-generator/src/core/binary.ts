/** Marker stored in the template map and VFS for files `writeTree` copies as bytes. */
export const BINARY_MARKER = "[Binary file]"

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".ico",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".pdf",
  ".wasm"
])

export const isBinaryTemplatePath = (filePath: string): boolean => {
  const lower = filePath.toLowerCase()
  const dot = lower.lastIndexOf(".")
  if (dot === -1) return false
  return BINARY_EXTENSIONS.has(lower.slice(dot))
}

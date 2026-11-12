/** npm scope segment: lowercase, no spaces; used as `@<scope>/…`. */
export const toPackageScope = (projectName: string): string => {
  const cleaned = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  if (cleaned.length === 0) {
    throw new Error(`Invalid project name: ${JSON.stringify(projectName)}`)
  }
  return cleaned
}

export const ETS_SCOPE = "@ets"

import { ETS_SCOPE } from "./projectName.ts"

export const buildRenameMap = (scope: string): ReadonlyArray<readonly [string, string]> => {
  const target = `@${scope}`
  return [
    [`${ETS_SCOPE}/`, `${target}/`],
    [ETS_SCOPE, target]
  ] as const
}

/** Rewrite `@ets` package references to `@<scope>` in text files. */
export const applyRename = (content: string, scope: string): string => {
  const target = `@${scope}`
  // Longer / more specific first: @ets/foo before bare @ets edge cases in filters.
  return content.replaceAll(`${ETS_SCOPE}/`, `${target}/`)
}

export const shouldRewriteFile = (relativePath: string): boolean => {
  const lower = relativePath.toLowerCase()
  return (
    lower.endsWith(".ts")
    || lower.endsWith(".tsx")
    || lower.endsWith(".js")
    || lower.endsWith(".jsx")
    || lower.endsWith(".json")
    || lower.endsWith(".jsonc")
    || lower.endsWith(".md")
    || lower.endsWith(".yml")
    || lower.endsWith(".yaml")
    || lower.endsWith(".toml")
    || lower.endsWith(".css")
    || lower.endsWith(".html")
  )
}

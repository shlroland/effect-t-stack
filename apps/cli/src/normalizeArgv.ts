const SUBCOMMANDS = new Set([
  "create",
  "add",
  "create-json",
  "add-json",
  "schema",
  "history"
])

/**
 * Preserve bunx UX: `create-effect-t-stack my-app --yes` → inject `create`.
 * Leave explicit subcommands and bare global help/version alone.
 */
export const normalizeArgv = (argv: ReadonlyArray<string>): ReadonlyArray<string> => {
  if (argv.length === 0) {
    return argv
  }

  const firstPositional = argv.find((token) => !token.startsWith("-"))
  if (firstPositional !== undefined && SUBCOMMANDS.has(firstPositional)) {
    return argv
  }

  // Root-only globals (effect/cli): don't force create
  const onlyGlobals = argv.every((token) => {
    if (!token.startsWith("-")) {
      return false
    }
    const name = token.split("=")[0]!
    return (
      name === "--help" ||
      name === "-h" ||
      name === "--version" ||
      name === "-v" ||
      name === "--completions" ||
      name === "--wizard" ||
      name === "--log-level"
    )
  })
  if (onlyGlobals) {
    return argv
  }

  return ["create", ...argv]
}

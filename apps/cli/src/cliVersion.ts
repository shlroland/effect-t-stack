import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

/** CLI package version from apps/cli/package.json. */
export const CLI_VERSION: string = (
  require("../package.json") as { readonly version: string }
).version

export const ETS_SCHEMA_URL =
  "https://raw.githubusercontent.com/shlroland/effect-t-stack/main/apps/cli/schemas/ets.schema.json"

/** Fingerprint schema version (ets.jsonc `version` field). Independent of CLI_VERSION. */
export const FINGERPRINT_SCHEMA_VERSION = 1 as const

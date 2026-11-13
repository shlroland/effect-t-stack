import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { CreateError } from "../shared/CreateError.ts"
import { CLI_VERSION, ETS_SCHEMA_URL } from "./cliVersion.ts"

export type Fingerprint = {
  readonly version: number
  readonly name?: string
  readonly addons: ReadonlyArray<string>
  readonly addonOptions?: Record<string, unknown>
  readonly packageManager?: string
  readonly createdAt?: string
  readonly cliVersion?: string
  readonly reproducibleCommand?: string
  readonly dbSetupOptions?: { readonly mode?: string; readonly [key: string]: unknown }
  readonly $schema?: string
  readonly [key: string]: unknown
}

/** Strip // line comments for JSONC parse. */
export const stripJsoncComments = (raw: string): string =>
  raw
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith("//")) {
        return ""
      }
      const idx = line.indexOf("//")
      if (idx === -1) {
        return line
      }
      // keep // inside strings — naive: only strip when not in quotes roughly
      let inString = false
      let escaped = false
      for (let i = 0; i < line.length - 1; i++) {
        const ch = line[i]!
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === "\\") {
          escaped = true
          continue
        }
        if (ch === "\"") {
          inString = !inString
          continue
        }
        if (!inString && ch === "/" && line[i + 1] === "/") {
          return line.slice(0, i).trimEnd()
        }
      }
      return line
    })
    .join("\n")

export const parseFingerprint = (raw: string): Fingerprint => {
  const parsed = JSON.parse(stripJsoncComments(raw)) as Fingerprint
  if (typeof parsed.version !== "number" || !Array.isArray(parsed.addons)) {
    throw new Error("Invalid fingerprint: expected version (number) and addons (array)")
  }
  return parsed
}

export const loadFingerprint = Effect.fn("loadFingerprint")(function*(projectDir: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const etsPath = path.join(projectDir, "ets.jsonc")
  const exists = yield* fs.exists(etsPath)
  if (!exists) {
    return yield* new CreateError({
      message: `No ets.jsonc in ${projectDir} — run create-effect-t-stack first, or cd into a generated app`
    })
  }
  const raw = yield* fs.readFileString(etsPath)
  try {
    return { path: etsPath, fingerprint: parseFingerprint(raw), raw }
  } catch (cause) {
    return yield* new CreateError({
      message: `Failed to parse ets.jsonc: ${cause instanceof Error ? cause.message : String(cause)}`
    })
  }
})

export const writeFingerprint = Effect.fn("writeFingerprint")(function*(
  etsPath: string,
  fingerprint: Fingerprint
) {
  const fs = yield* FileSystem.FileSystem
  const body = JSON.stringify(fingerprint, null, 2)
  const header = "// Fingerprint. Field classes: stack dims · addons[] · addonOptions · meta.\n" +
    "// See docs/fingerprint.md. version = schema version; cliVersion = CLI release.\n"
  yield* fs.writeFileString(etsPath, `${header}${body}\n`)
})

export type CreateStampInput = {
  readonly scope: string
  readonly packageManager: string
  readonly reproducibleCommand: string
  readonly manualDb?: boolean
}

/** Pure stamp applied when copying ets.jsonc during create. */
export const stampCreateFingerprint = (raw: string, input: CreateStampInput): string => {
  const fp = parseFingerprint(raw)
  const next: Fingerprint = {
    ...fp,
    $schema: ETS_SCHEMA_URL,
    name: input.scope,
    packageManager: input.packageManager,
    createdAt: fp.createdAt ?? new Date().toISOString(),
    cliVersion: CLI_VERSION,
    reproducibleCommand: input.reproducibleCommand,
    ...(input.manualDb
      ? { dbSetupOptions: { ...fp.dbSetupOptions, mode: "manual" as const } }
      : {})
  }
  const header = "// Fingerprint (generated). version = schema version; cliVersion = CLI release.\n" +
    "// Keep for `add`; safe to delete only if you abandon the CLI. See docs/fingerprint.md.\n"
  return `${header}${JSON.stringify(next, null, 2)}\n`
}

export const recordAddon = (
  fingerprint: Fingerprint,
  addon: string,
  options?: Record<string, unknown>
): Fingerprint => {
  const addons = fingerprint.addons.includes(addon)
    ? fingerprint.addons
    : [...fingerprint.addons, addon]
  const addonOptions = options === undefined
    ? fingerprint.addonOptions
    : {
      ...fingerprint.addonOptions,
      [addon]: {
        ...(fingerprint.addonOptions?.[addon] as Record<string, unknown> | undefined),
        ...options
      }
    }
  return {
    ...fingerprint,
    addons,
    addonOptions,
    cliVersion: CLI_VERSION
  }
}

/** Addons the default `--yes` stack already includes. `add` only ensures the fingerprint entry. */
export const DEFAULT_ADDONS = [
  "turborepo",
  "skills",
  "repos",
  "language-service",
  "mcp",
  "effect-style"
] as const

export type DefaultAddon = (typeof DEFAULT_ADDONS)[number]

export const isDefaultAddon = (name: string): name is DefaultAddon =>
  (DEFAULT_ADDONS as ReadonlyArray<string>).includes(name)

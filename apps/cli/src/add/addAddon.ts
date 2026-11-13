import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Path from "effect/Path"
import { validateAddonAgainstFingerprint, validateDefaultAddon } from "../compatibility/index.ts"
import { CLI_VERSION } from "../fingerprint/cliVersion.ts"
import { loadFingerprint, recordAddon, writeFingerprint } from "../fingerprint/fingerprint.ts"
import { appendHistory } from "../fingerprint/history.ts"

export type AddAddonOptions = {
  readonly addon: string
  readonly projectDir: string
  readonly dryRun: boolean
  readonly verbose: boolean
}

/**
 * L2 thin `add <addon>`:
 * - Golden Sample addons: ensure fingerprint entry (files already present on create).
 * - Other addons: clear error until L3 template overlays exist.
 */
export const addAddon = Effect.fn("addAddon")(function*(options: AddAddonOptions) {
  const path = yield* Path.Path
  const projectDir = path.resolve(options.projectDir)
  const addon = options.addon.trim()

  yield* validateDefaultAddon(addon)

  const { path: etsPath, fingerprint } = yield* loadFingerprint(projectDir)
  yield* validateAddonAgainstFingerprint(fingerprint, addon)
  if (fingerprint.addons.includes(addon)) {
    const result = {
      ok: true as const,
      action: "add-addon",
      addon,
      alreadyPresent: true,
      dryRun: options.dryRun
    }
    if (options.verbose) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(`Addon "${addon}" already enabled in ets.jsonc`)
    }
    return result
  }

  if (options.dryRun) {
    const result = {
      ok: true as const,
      action: "add-addon",
      addon,
      alreadyPresent: false,
      dryRun: true
    }
    if (options.verbose) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(`Dry run — would enable addon "${addon}" in ets.jsonc`)
    }
    return result
  }

  const next = {
    ...recordAddon(fingerprint, addon),
    cliVersion: CLI_VERSION,
    reproducibleCommand: `create-effect-t-stack add ${addon}`
  }
  yield* writeFingerprint(etsPath, next)
  yield* appendHistory({
    at: new Date().toISOString(),
    command: next.reproducibleCommand,
    projectDir
  })

  const result = {
    ok: true as const,
    action: "add-addon",
    addon,
    alreadyPresent: false,
    dryRun: false
  }
  if (options.verbose) {
    yield* Console.log(JSON.stringify(result, null, 2))
  } else {
    yield* Console.log(
      `Enabled "${addon}" in ets.jsonc (default create already includes this addon's files).`
    )
  }
  return result
})

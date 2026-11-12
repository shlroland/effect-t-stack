import * as Effect from "effect/Effect"
import { GOLDEN_ADDONS, isGoldenAddon } from "../fingerprint/fingerprint.ts"
import { CreateError } from "../shared/CreateError.ts"
import { ruleMessage } from "./catalog.ts"

export type ResolvedAddInput =
  | { readonly kind: "package"; readonly packageName: string }
  | { readonly kind: "addon"; readonly addon: string }

export type AddInputFields = {
  readonly packageName?: string | undefined
  readonly addon?: string | undefined
}

/**
 * Stage: auth/addons — mutual exclusion for CLI `add` and agent `add-json`.
 * Order within add: mutex → (package name rules in addPackage) | (golden allowlist + fingerprint).
 */
export const resolveAddInput = (
  input: AddInputFields
): Effect.Effect<ResolvedAddInput, CreateError> => {
  const packageName = input.packageName?.trim()
  const addon = input.addon?.trim()
  const hasPackage = packageName !== undefined && packageName.length > 0
  const hasAddon = addon !== undefined && addon.length > 0

  if (hasPackage && hasAddon) {
    return Effect.fail(new CreateError({ message: ruleMessage("add.mutex.package-or-addon") }))
  }
  if (hasPackage) {
    return Effect.succeed({ kind: "package", packageName: packageName! })
  }
  if (hasAddon) {
    return Effect.succeed({ kind: "addon", addon: addon! })
  }
  return Effect.fail(
    new CreateError({
      message: "Pass either an addon or --package <name> (agent: { \"addon\" } | { \"packageName\" })"
    })
  )
}

export const validateGoldenAddon = (addon: string): Effect.Effect<void, CreateError> => {
  if (!isGoldenAddon(addon)) {
    return Effect.fail(
      new CreateError({
        message: `Addon "${addon}" is not available yet. Golden addons: ${GOLDEN_ADDONS.join(", ")}. ${
          ruleMessage("add.addons.golden-only")
        }`
      })
    )
  }
  return Effect.void
}

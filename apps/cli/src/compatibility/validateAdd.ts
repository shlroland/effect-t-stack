import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import { DEFAULT_ADDONS, isDefaultAddon } from "../fingerprint/fingerprint.ts"
import { CreateError } from "../shared/CreateError.ts"
import { ruleMessage } from "./catalog.ts"

export type ResolvedAddInput =
  | { readonly kind: "package"; readonly packageName: string }
  | { readonly kind: "addon"; readonly addon: string }

export type AddInputFields = {
  readonly packageName?: string | undefined
  readonly addon?: string | undefined
}

/** Trim + require non-empty; absent/blank → None. */
const optionalNonEmpty = (value: string | undefined): Option.Option<string> => {
  if (value === undefined) {
    return Option.none()
  }
  const trimmed = value.trim()
  return trimmed.length === 0 ? Option.none() : Option.some(trimmed)
}

/**
 * Stage: auth/addons — mutual exclusion for CLI `add` and agent `add-json`.
 * Order within add: mutex → (package name rules in addPackage) | (default-addon allowlist + fingerprint).
 */
export const resolveAddInput = (
  input: AddInputFields
): Effect.Effect<ResolvedAddInput, CreateError> => {
  const packageName = optionalNonEmpty(input.packageName)
  const addon = optionalNonEmpty(input.addon)

  if (Option.isSome(packageName) && Option.isSome(addon)) {
    return Effect.fail(new CreateError({ message: ruleMessage("add.mutex.package-or-addon") }))
  }
  if (Option.isSome(packageName)) {
    return Effect.succeed({ kind: "package", packageName: packageName.value })
  }
  if (Option.isSome(addon)) {
    return Effect.succeed({ kind: "addon", addon: addon.value })
  }
  return Effect.fail(
    new CreateError({
      message: "Pass either an addon or --package <name> (agent: { \"addon\" } | { \"packageName\" })"
    })
  )
}

export const validateDefaultAddon = (addon: string): Effect.Effect<void, CreateError> => {
  if (!isDefaultAddon(addon)) {
    return Effect.fail(
      new CreateError({
        message: `Addon "${addon}" is not available yet. Default addons: ${DEFAULT_ADDONS.join(", ")}. ${
          ruleMessage("add.addons.default-only")
        }`
      })
    )
  }
  return Effect.void
}

/** Lowercase kebab package segment for `add --package`. */
export const PackageNameSchema = Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9-]*$/))

export const decodePackageName = (name: string): Effect.Effect<string, CreateError> => {
  const trimmed = name.trim()
  return Schema.decodeUnknownEffect(PackageNameSchema)(trimmed).pipe(
    Effect.mapError(() =>
      new CreateError({
        message: `Invalid package name "${trimmed}" (use lowercase kebab-case, e.g. billing)`
      })
    )
  )
}

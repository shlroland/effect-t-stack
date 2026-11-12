import * as Effect from "effect/Effect"
import type { Fingerprint } from "../fingerprint/fingerprint.ts"
import { CreateError } from "../shared/CreateError.ts"
import { EFFECT_STYLE_CONFLICTS, ruleMessage } from "./catalog.ts"

/** Validate a prospective `addons[]` set (after create stamp or before `add` write). */
export const validateAddonSet = (
  addons: ReadonlyArray<string>
): Effect.Effect<void, CreateError> => {
  if (addons.includes("effect-style") && !addons.includes("repos")) {
    return Effect.fail(
      new CreateError({ message: ruleMessage("add.addons.effect-style.requires-repos") })
    )
  }
  if (addons.includes("effect-style")) {
    const hit = EFFECT_STYLE_CONFLICTS.find((name) => addons.includes(name))
    if (hit !== undefined) {
      return Effect.fail(
        new CreateError({
          message: `${ruleMessage("add.addons.effect-style.conflicts")} (found "${hit}")`
        })
      )
    }
  }
  return Effect.void
}

export const nextAddons = (fingerprint: Fingerprint, addon: string): ReadonlyArray<string> =>
  fingerprint.addons.includes(addon) ? fingerprint.addons : [...fingerprint.addons, addon]

export const validateAddonAgainstFingerprint = (
  fingerprint: Fingerprint,
  addon: string
): Effect.Effect<void, CreateError> => validateAddonSet(nextAddons(fingerprint, addon))

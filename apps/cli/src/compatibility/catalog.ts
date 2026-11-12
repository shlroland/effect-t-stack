/**
 * Illegal-combo / capability catalog for create + add.
 * Agents: validation order is enums → combinations → auth/addons → examples.
 * Full Option Matrix cells deepen in L3; deferred rules are documented here so
 * agents do not invent them as active create/add behavior.
 */

export type ValidationStage = "enums" | "combinations" | "authAddons" | "examples"

export type RuleStatus = "active" | "deferred"

export type CompatibilityRule = {
  readonly id: string
  readonly stage: ValidationStage
  readonly status: RuleStatus
  readonly summary: string
  /** Human-facing reject message when status is active; rationale when deferred. */
  readonly message: string
}

/** Addons that conflict with `effect-style` (golden `addonOptions.effect-style.conflictsWith`). */
export const EFFECT_STYLE_CONFLICTS = ["biome", "ultracite", "oxlint-only", "husky"] as const

export const CREATE_PACKAGE_MANAGERS = ["bun", "npm", "pnpm"] as const
export const CREATE_APIS = ["rpc", "httpapi"] as const
export const CREATE_DIRECTORY_CONFLICTS = ["error", "overwrite", "increment", "merge"] as const

/** Ordered catalog — keep stages contiguous for agent docs. */
export const COMPATIBILITY_RULES: ReadonlyArray<CompatibilityRule> = [
  {
    id: "create.enums.packageManager",
    stage: "enums",
    status: "active",
    summary: "packageManager ∈ {bun, npm, pnpm}",
    message: `Invalid packageManager. Allowed: ${CREATE_PACKAGE_MANAGERS.join(", ")}.`
  },
  {
    id: "create.enums.api",
    stage: "enums",
    status: "active",
    summary: "api ∈ {rpc, httpapi}",
    message: `Invalid api. Allowed: ${CREATE_APIS.join(", ")}.`
  },
  {
    id: "create.enums.directoryConflict",
    stage: "enums",
    status: "active",
    summary: "directoryConflict ∈ {error, overwrite, increment, merge}",
    message: `Invalid directoryConflict. Allowed: ${CREATE_DIRECTORY_CONFLICTS.join(", ")}.`
  },
  {
    id: "create.combinations.api.rpc-only",
    stage: "combinations",
    status: "active",
    summary: "create api must be rpc until L3 primary flip",
    message:
      "api=httpapi primary flip is not implemented yet (golden is rpc-primary). Flag accepted for plumbing; matrix completeness is L3."
  },
  {
    id: "create.combinations.database.none+drizzle",
    stage: "combinations",
    status: "deferred",
    summary: "database=none cannot pair with drizzle/prisma/mongoose",
    message: "Deferred to L3 Option Matrix (no --database flag yet)."
  },
  {
    id: "create.combinations.frontend.none",
    stage: "combinations",
    status: "deferred",
    summary: "frontend=none is API-only shape",
    message: "Deferred to L3 (no --frontend flag yet)."
  },
  {
    id: "create.auth.none-without-backend-db",
    stage: "authAddons",
    status: "deferred",
    summary: "No backend / no DB ⇒ force auth=none",
    message: "Deferred to L3 auth × backend × database matrix."
  },
  {
    id: "create.auth.payments.requires-better-auth",
    stage: "authAddons",
    status: "deferred",
    summary: "payments=polar requires better-auth",
    message: "Deferred to L3 (--payments not wired)."
  },
  {
    id: "create.addons.effect-style.required",
    stage: "authAddons",
    status: "active",
    summary: "create must keep effect-style until L3 omit path",
    message:
      "Omitting effect-style at create is not implemented yet (golden ships with it). Keep --effect-style (default) until L3 addon omit path lands."
  },
  {
    id: "add.addons.golden-only",
    stage: "authAddons",
    status: "active",
    summary: "add <addon> only Golden Sample addons in L2",
    message: "Non-golden addons need L3 template overlays."
  },
  {
    id: "add.addons.effect-style.requires-repos",
    stage: "authAddons",
    status: "active",
    summary: "effect-style requires repos (vendored @effect/oxc)",
    message:
      "Addon \"effect-style\" requires \"repos\" in ets.jsonc addons (vendored @effect/oxc). Re-enable repos or wait for published @effect/oxc (L3+)."
  },
  {
    id: "add.addons.effect-style.conflicts",
    stage: "authAddons",
    status: "active",
    summary: "effect-style conflicts with biome / ultracite / oxlint-only / husky",
    message: `Addon "effect-style" conflicts with: ${
      EFFECT_STYLE_CONFLICTS.join(", ")
    }. Remove the conflicting addon or omit effect-style (L3).`
  },
  {
    id: "add.mutex.package-or-addon",
    stage: "authAddons",
    status: "active",
    summary: "add accepts either --package or <addon>, not both",
    message: "Pass either --package <name> or <addon>, not both"
  },
  {
    id: "create.examples.matrix",
    stage: "examples",
    status: "deferred",
    summary: "examples ∈ {todo, ai, none} and combo checks",
    message: "Deferred to L3 (--examples not wired)."
  }
]

export const rulesByStage = (stage: ValidationStage): ReadonlyArray<CompatibilityRule> =>
  COMPATIBILITY_RULES.filter((rule) => rule.stage === stage)

export const activeRules = (): ReadonlyArray<CompatibilityRule> =>
  COMPATIBILITY_RULES.filter((rule) => rule.status === "active")

export const findRule = (id: string): CompatibilityRule | undefined =>
  COMPATIBILITY_RULES.find((rule) => rule.id === id)

export const ruleMessage = (id: string): string => {
  const rule = findRule(id)
  if (rule === undefined) {
    throw new Error(`Unknown compatibility rule: ${id}`)
  }
  return rule.message
}

export { createEffectTStack } from "./Cli.ts"
export {
  activeRules,
  COMPATIBILITY_RULES,
  resolveAddInput,
  validateAddonSet,
  validateCreateOptions,
  validateGoldenAddon
} from "./compatibility/index.ts"
export type { CompatibilityRule, ResolvedAddInput, ValidationStage } from "./compatibility/index.ts"
export { executeCopy, planCopy, resolveTargetDirectory } from "./create/copyGolden.ts"
export type { CopyPlan } from "./create/copyGolden.ts"
export { createProject } from "./create/create.ts"
export type { ApiPrimary, CreateOptions, DirectoryConflict } from "./create/CreateOptions.ts"
export type { CreateResult } from "./create/CreateResult.ts"
export { formatVerbose, makeCreateResult } from "./create/CreateResult.ts"
export {
  emitPackageManagerArtifacts,
  installCommand,
  resolvePackageManagerPin
} from "./create/packageManagers.ts"
export type { PackageManager } from "./create/packageManagers.ts"
export { CLI_VERSION, ETS_SCHEMA_URL, FINGERPRINT_SCHEMA_VERSION } from "./fingerprint/cliVersion.ts"
export {
  GOLDEN_ADDONS,
  loadFingerprint,
  parseFingerprint,
  stampCreateFingerprint,
  writeFingerprint
} from "./fingerprint/fingerprint.ts"
export type { Fingerprint } from "./fingerprint/fingerprint.ts"
export { normalizeArgv } from "./normalizeArgv.ts"
export { CreateError } from "./shared/CreateError.ts"
export { COPY_DENY_NAMES, isDeniedName } from "./template/denylist.ts"
export { resolveGoldenRoot } from "./template/paths.ts"
export { toPackageScope } from "./template/projectName.ts"
export { applyRename, buildRenameMap, shouldRewriteFile } from "./template/rename.ts"

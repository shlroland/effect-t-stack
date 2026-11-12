import * as Argument from "effect/cli/Argument"
import * as Command from "effect/cli/Command"
import * as Flag from "effect/cli/Flag"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { resolveAddInput } from "../compatibility/index.ts"
import { addAddon } from "./addAddon.ts"
import { addPackage } from "./addPackage.ts"

const addonArg = Argument.String("addon").pipe(
  Argument.withDescription("Addon id to enable in ets.jsonc (Golden addons in L2)"),
  Argument.optional
)

const packageName = Flag.String("package").pipe(
  Flag.withDescription("Scaffold packages/<name> (manifest + src/index.ts + tsconfig)"),
  Flag.optional
)

const projectDir = Flag.String("project-dir").pipe(
  Flag.withDescription("Existing project root containing ets.jsonc (default: cwd)"),
  Flag.withDefault(".")
)

const dryRun = Flag.Boolean("dry-run").pipe(Flag.withDefault(false))
const verbose = Flag.Boolean("verbose").pipe(Flag.withAlias("V"), Flag.withDefault(false))

export const addCommand = Command.make("add", {
  addonArg,
  packageName,
  projectDir,
  dryRun,
  verbose
}).pipe(
  Command.withDescription(
    "Add an addon fingerprint entry or scaffold an empty workspace package (L2)"
  ),
  Command.withHandler((config) =>
    Effect.gen(function*() {
      const resolved = yield* resolveAddInput({
        packageName: Option.getOrUndefined(config.packageName),
        addon: Option.getOrUndefined(config.addonArg)
      })

      if (resolved.kind === "package") {
        return yield* addPackage({
          packageName: resolved.packageName,
          projectDir: config.projectDir,
          dryRun: config.dryRun,
          verbose: config.verbose
        }).pipe(Effect.asVoid)
      }

      return yield* addAddon({
        addon: resolved.addon,
        projectDir: config.projectDir,
        dryRun: config.dryRun,
        verbose: config.verbose
      }).pipe(Effect.asVoid)
    })
  )
)

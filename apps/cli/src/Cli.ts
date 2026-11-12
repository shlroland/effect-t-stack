import * as Argument from "effect/cli/Argument"
import * as Command from "effect/cli/Command"
import * as Flag from "effect/cli/Flag"
import * as Effect from "effect/Effect"
import { createProject } from "./create.ts"

const projectName = Argument.String("name").pipe(
  Argument.withDescription("Project directory / npm scope name")
)

const yes = Flag.Boolean("yes").pipe(
  Flag.withAlias("y"),
  Flag.withDescription("Non-interactive create (required in L1 thin MVP unless --dry-run)"),
  Flag.withDefault(false)
)

const dryRun = Flag.Boolean("dry-run").pipe(
  Flag.withDescription("Print the copy/rename plan without writing files"),
  Flag.withDefault(false)
)

const install = Flag.Boolean("install").pipe(
  Flag.withDescription("Run bun install in the target (default true; use --no-install to skip)"),
  Flag.withDefault(true)
)

const git = Flag.Boolean("git").pipe(
  Flag.withDescription("git init the target (default true; use --no-git to skip)"),
  Flag.withDefault(true)
)

const directoryConflict = Flag.Literals(
  "directory-conflict",
  [
    "error",
    "overwrite",
    "increment"
  ] as const
).pipe(
  Flag.withDescription("What to do when the target directory already exists"),
  Flag.withDefault("error" as const)
)

export const createEffectTStack = Command.make("create-effect-t-stack", {
  projectName,
  yes,
  dryRun,
  install,
  git,
  directoryConflict
}).pipe(
  Command.withDescription(
    "Whole-tree copy of the Golden Sample (examples/golden) with @ets/* → @<name>/* rename"
  ),
  Command.withHandler((config) =>
    createProject({
      projectName: config.projectName,
      yes: config.yes,
      dryRun: config.dryRun,
      install: config.install,
      git: config.git,
      directoryConflict: config.directoryConflict
    }).pipe(Effect.asVoid)
  )
)

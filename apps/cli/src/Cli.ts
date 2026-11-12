import * as Argument from "effect/cli/Argument"
import * as Command from "effect/cli/Command"
import * as Flag from "effect/cli/Flag"
import * as Prompt from "effect/cli/Prompt"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { createProject } from "./create.ts"

const projectName = Argument.String("name").pipe(
  Argument.withDescription("Project directory / npm scope name"),
  Argument.withFallbackPrompt(Prompt.String({ message: "Project name" }))
)

const yes = Flag.Boolean("yes").pipe(
  Flag.withAlias("y"),
  Flag.withDescription("Non-interactive create (skip confirmation prompts)"),
  Flag.withDefault(false)
)

const yolo = Flag.Boolean("yolo").pipe(
  Flag.withDescription("Auto-confirm and treat directory-conflict error as overwrite"),
  Flag.withDefault(false)
)

const dryRun = Flag.Boolean("dry-run").pipe(
  Flag.withDescription("Print the copy/rename plan without writing files"),
  Flag.withDefault(false)
)

const verbose = Flag.Boolean("verbose").pipe(
  Flag.withAlias("V"),
  Flag.withDescription("Print a JSON CreateResult (phases, paths, options) for agents"),
  Flag.withDefault(false)
)

const install = Flag.Boolean("install").pipe(
  Flag.withDescription("Run package-manager install in the target (default true)"),
  Flag.withDefault(true)
)

const git = Flag.Boolean("git").pipe(
  Flag.withDescription("git init the target (default true)"),
  Flag.withDefault(true)
)

const renderTitle = Flag.Boolean("render-title").pipe(
  Flag.withDescription("Print the create-effect-t-stack banner (default true)"),
  Flag.withDefault(true)
)

const open = Flag.String("open").pipe(
  Flag.withDescription("Editor/agent binary to open the project with (e.g. cursor, code)"),
  Flag.optional
)

const manualDb = Flag.Boolean("manual-db").pipe(
  Flag.withDescription("Stamp dbSetupOptions.mode=manual in ets.jsonc (behavior in L4)"),
  Flag.withDefault(false)
)

const directoryConflict = Flag.Literals(
  "directory-conflict",
  [
    "error",
    "overwrite",
    "increment",
    "merge"
  ] as const
).pipe(
  Flag.withDescription("What to do when the target directory already exists"),
  Flag.withDefault("error" as const)
)

const packageManager = Flag.Literals("package-manager", ["bun", "npm", "pnpm"] as const).pipe(
  Flag.withAlias("pm"),
  Flag.withDescription("Package manager for install + workspace artifacts"),
  Flag.withDefault("bun" as const)
)

const api = Flag.Literals("api", ["rpc", "httpapi"] as const).pipe(
  Flag.withDescription("API primary (L1 plumbing; only rpc is implemented until L3)"),
  Flag.withDefault("rpc" as const)
)

const effectStyle = Flag.Boolean("effect-style").pipe(
  Flag.withDescription("Include effect-style addon (default true; omit path is L3)"),
  Flag.withDefault(true)
)

export const createEffectTStack = Command.make("create-effect-t-stack", {
  projectName,
  yes,
  yolo,
  dryRun,
  verbose,
  install,
  git,
  renderTitle,
  open,
  manualDb,
  directoryConflict,
  packageManager,
  api,
  effectStyle
}).pipe(
  Command.withDescription(
    "Whole-tree copy of the Golden Sample (examples/golden) with @ets/* → @<name>/* rename"
  ),
  Command.withHandler((config) =>
    createProject({
      projectName: config.projectName,
      yes: config.yes,
      yolo: config.yolo,
      dryRun: config.dryRun,
      verbose: config.verbose,
      install: config.install,
      git: config.git,
      renderTitle: config.renderTitle,
      open: Option.getOrUndefined(config.open),
      manualDb: config.manualDb,
      directoryConflict: config.directoryConflict,
      packageManager: config.packageManager,
      api: config.api,
      effectStyle: config.effectStyle
    }).pipe(Effect.asVoid)
  )
)

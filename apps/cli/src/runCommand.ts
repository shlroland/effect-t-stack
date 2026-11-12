import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { ChildProcess } from "effect/process"
import { ChildProcessSpawner } from "effect/process/ChildProcessSpawner"
import { CreateError } from "./CreateError.ts"

export const runCommand = Effect.fn("runCommand")(function*(
  command: string,
  args: ReadonlyArray<string>,
  options: {
    readonly cwd: string
    readonly quiet: boolean
  }
) {
  if (!options.quiet) {
    yield* Console.log(`$ ${command} ${args.join(" ")}`)
  }
  const spawner = yield* ChildProcessSpawner
  const code = yield* spawner.exitCode(
    ChildProcess.make(command, args, {
      cwd: options.cwd,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit"
    })
  )
  if (code !== 0) {
    return yield* new CreateError({ message: `${command} exited with code ${code}` })
  }
})

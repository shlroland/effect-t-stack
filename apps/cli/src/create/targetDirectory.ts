import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { CreateError } from "../shared/CreateError.ts"
import type { DirectoryConflict } from "./CreateOptions.ts"

export const resolveTargetDirectory = Effect.fn("resolveTargetDirectory")(function*(
  cwd: string,
  projectName: string,
  conflict: DirectoryConflict
) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  let target = path.join(cwd, projectName)
  const exists = yield* fs.exists(target)
  if (!exists) {
    return target
  }
  if (conflict === "error") {
    return yield* new CreateError({ message: `Target directory already exists: ${target}` })
  }
  if (conflict === "overwrite") {
    yield* fs.remove(target, { recursive: true, force: true })
    return target
  }
  if (conflict === "merge") {
    return target
  }
  let i = 1
  while (yield* fs.exists(path.join(cwd, `${projectName}-${i}`))) {
    i += 1
  }
  target = path.join(cwd, `${projectName}-${i}`)
  return target
})

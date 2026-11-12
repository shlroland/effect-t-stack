import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import type * as PlatformError from "effect/PlatformError"
import { stampCreateFingerprint } from "../fingerprint/fingerprint.ts"
import { CreateError } from "../shared/CreateError.ts"
import { isDeniedName } from "../template/denylist.ts"
import { applyRename, shouldRewriteFile } from "../template/rename.ts"
import type { DirectoryConflict } from "./CreateOptions.ts"

export type CopyPlan = {
  readonly files: ReadonlyArray<string>
  readonly scope: string
  readonly targetDir: string
  readonly goldenRoot: string
  readonly packageManager: string
  readonly reproducibleCommand: string
  readonly manualDb: boolean
}

export const planCopy = Effect.fn("planCopy")(function*(
  goldenRoot: string,
  targetDir: string,
  scope: string,
  meta: {
    readonly packageManager: string
    readonly reproducibleCommand: string
    readonly manualDb: boolean
  }
) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const files: Array<string> = []

  const walk = (dir: string): Effect.Effect<void, PlatformError.PlatformError> =>
    Effect.gen(function*() {
      const entries = yield* fs.readDirectory(dir)
      for (const name of entries) {
        if (isDeniedName(name)) {
          continue
        }
        const abs = path.join(dir, name)
        const info = yield* fs.stat(abs)
        if (info.type === "Directory") {
          yield* walk(abs)
          continue
        }
        if (info.type === "SymbolicLink") {
          continue
        }
        if (info.type === "File") {
          files.push(path.relative(goldenRoot, abs))
        }
      }
    })

  yield* walk(goldenRoot)
  files.sort()
  return {
    files,
    scope,
    targetDir,
    goldenRoot,
    packageManager: meta.packageManager,
    reproducibleCommand: meta.reproducibleCommand,
    manualDb: meta.manualDb
  } satisfies CopyPlan
})

export const executeCopy = Effect.fn("executeCopy")(function*(plan: CopyPlan) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  yield* fs.makeDirectory(plan.targetDir, { recursive: true })

  for (const rel of plan.files) {
    const src = path.join(plan.goldenRoot, rel)
    const dest = path.join(plan.targetDir, rel)
    yield* fs.makeDirectory(path.dirname(dest), { recursive: true })
    if (shouldRewriteFile(rel)) {
      const raw = yield* fs.readFileString(src)
      let next = applyRename(raw, plan.scope)
      if (rel === "package.json") {
        next = rewriteRootPackageName(next, plan.scope)
      }
      if (rel === "ets.jsonc") {
        next = stampCreateFingerprint(next, {
          scope: plan.scope,
          packageManager: plan.packageManager,
          reproducibleCommand: plan.reproducibleCommand,
          manualDb: plan.manualDb
        })
      }
      yield* fs.writeFileString(dest, next)
    } else {
      yield* fs.copyFile(src, dest)
    }
  }
})

const rewriteRootPackageName = (content: string, scope: string): string => {
  try {
    const json = JSON.parse(content) as { name?: string }
    json.name = scope
    return `${JSON.stringify(json, null, 2)}\n`
  } catch {
    return content
  }
}

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
    // Keep existing tree; executeCopy overwrites individual files in place.
    return target
  }
  let i = 1
  while (yield* fs.exists(path.join(cwd, `${projectName}-${i}`))) {
    i += 1
  }
  target = path.join(cwd, `${projectName}-${i}`)
  return target
})

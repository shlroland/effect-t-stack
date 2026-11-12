import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import type * as PlatformError from "effect/PlatformError"
import { CreateError } from "./CreateError.ts"
import { isDeniedName } from "./denylist.ts"
import { applyRename, shouldRewriteFile } from "./rename.ts"

export type CopyPlan = {
  readonly files: ReadonlyArray<string>
  readonly scope: string
  readonly targetDir: string
  readonly goldenRoot: string
}

export const planCopy = Effect.fn("planCopy")(function*(
  goldenRoot: string,
  targetDir: string,
  scope: string
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
  return { files, scope, targetDir, goldenRoot } satisfies CopyPlan
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
        next = stampFingerprint(next, plan.scope)
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

const stampFingerprint = (content: string, scope: string): string => {
  let next = content.replace(/("name"\s*:\s*)"[^"]*"/, `$1${JSON.stringify(scope)}`)
  if (next.includes("\"createdAt\"")) {
    return next
  }
  const createdAt = new Date().toISOString()
  const stamp = `\n  "createdAt": ${JSON.stringify(createdAt)},\n  "cliVersion": "0.1.0",\n  "reproducibleCommand": ${
    JSON.stringify(`create-effect-t-stack ${scope} --yes`)
  },`
  return next.replace(/("version"\s*:\s*\d+\s*,)/, `$1${stamp}`)
}

export const resolveTargetDirectory = Effect.fn("resolveTargetDirectory")(function*(
  cwd: string,
  projectName: string,
  conflict: "error" | "overwrite" | "increment"
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
  let i = 1
  while (yield* fs.exists(path.join(cwd, `${projectName}-${i}`))) {
    i += 1
  }
  target = path.join(cwd, `${projectName}-${i}`)
  return target
})

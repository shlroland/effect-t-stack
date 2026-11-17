import * as Effect from "effect/Effect"
import { copyFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { BINARY_MARKER } from "./core/template-engine.ts"
import { GeneratorError, type VirtualFileTree, type VirtualNode } from "./types.ts"

const defaultBinaryRoot = fileURLToPath(new URL("../templates-binary/", import.meta.url))

export type WriteTreeOptions = {
  /** Directory that holds binary bytes keyed by template `sourcePath`. */
  readonly binaryRoot?: string
}

const writeNode = async (node: VirtualNode, directory: string, binaryRoot: string): Promise<void> => {
  const target = path.join(directory, node.name)
  if (node.type === "directory") {
    await mkdir(target, { recursive: true })
    for (const child of node.children) await writeNode(child, target, binaryRoot)
    return
  }
  await mkdir(directory, { recursive: true })
  if (node.content === BINARY_MARKER && node.sourcePath !== undefined) {
    await copyFile(path.resolve(binaryRoot, node.sourcePath), target)
    return
  }
  await writeFile(target, node.content)
}

/**
 * Node-only materializer. `generate` does not import this module.
 * `projectDir` is the destination; the tree root's name is not appended.
 */
export const writeTree = Effect.fn("writeTree")(function*(
  tree: VirtualFileTree,
  projectDir: string,
  options?: WriteTreeOptions
) {
  const binaryRoot = options?.binaryRoot ?? defaultBinaryRoot
  yield* Effect.tryPromise({
    try: async () => {
      await mkdir(projectDir, { recursive: true })
      for (const child of tree.root.children) {
        await writeNode(child, projectDir, binaryRoot)
      }
    },
    catch: (cause) =>
      new GeneratorError({
        phase: "write",
        message: cause instanceof Error ? cause.message : String(cause),
        cause
      })
  })
})

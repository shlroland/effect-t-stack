import { copyFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { BINARY_MARKER } from "./core/binary.ts"
import type { VirtualFileTree, VirtualNode } from "./types.ts"

const defaultBinaryRoot = fileURLToPath(new URL("../templates-binary/", import.meta.url))

export type WriteTreeOptions = {
  /** Directory that holds binary bytes keyed by template `sourcePath`. */
  readonly binaryRoot?: string
}

/**
 * Node-only materializer. `generate` does not import this module.
 * `projectDir` is the destination; the tree root's name is not appended.
 */
export const writeTree = async (
  tree: VirtualFileTree,
  projectDir: string,
  options?: WriteTreeOptions
): Promise<void> => {
  await mkdir(projectDir, { recursive: true })
  const binaryRoot = options?.binaryRoot ?? defaultBinaryRoot
  for (const child of tree.root.children) {
    await writeNode(child, projectDir, binaryRoot)
  }
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

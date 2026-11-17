import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import { Volume } from "memfs"

import type { VirtualDirNode, VirtualFileNode, VirtualNode } from "../types.ts"
import { dirnamePosix, toAbsolute, toRelative } from "./paths.ts"

type MemVolume = {
  mkdirSync: (path: string, options?: { recursive?: boolean }) => void
  writeFileSync: (path: string, data: string) => void
  readFileSync: (path: string, encoding: "utf8") => string
  existsSync: (path: string) => boolean
  statSync: (path: string) => { isFile: () => boolean; isDirectory: () => boolean }
  readdirSync: (path: string) => ReadonlyArray<string | Uint8Array>
  unlinkSync: (path: string) => void
}

type MutableDir = {
  type: "directory"
  name: string
  children: Array<VirtualNode>
}

/**
 * In-memory project tree for `generate`. Browser-safe: no disk I/O.
 * Paths are absolute inside memfs and relative everywhere callers see them.
 *
 * Methods are sync because memfs is sync; the Layer is the Effect boundary.
 */
export class VirtualFs extends Context.Service<VirtualFs, {
  readonly writeFile: (path: string, content: string, sourcePath?: string) => void
  readonly readFile: (path: string) => string
  readonly exists: (path: string) => boolean
  readonly fileExists: (path: string) => boolean
  readonly directoryExists: (path: string) => boolean
  readonly readJson: <T = unknown>(path: string) => T
  readonly writeJson: (path: string, value: unknown) => void
  readonly deleteFile: (path: string) => void
  readonly getAllFiles: () => ReadonlyArray<string>
  readonly getFileCount: () => number
  readonly toTree: (rootName: string) => VirtualDirNode
}>()("@effect-t-stack/template-generator/core/VirtualFs") {
  /** Fresh memfs volume per build. */
  static readonly layer: Layer.Layer<VirtualFs> = Layer.sync(VirtualFs)(() => makeMemVirtualFs())
}

export type VirtualFsService = VirtualFs["Service"]

/** @deprecated Prefer `VirtualFs.layer` + `yield* VirtualFs`, or `makeMemVirtualFs` in tests. */
export const createVirtualFileSystem = (): VirtualFsService => makeMemVirtualFs()

export const makeMemVirtualFs = (): VirtualFsService => {
  const volume = new Volume() as unknown as MemVolume
  const sourcePaths = new Map<string, string>()

  const writeFile = (path: string, content: string, sourcePath?: string): void => {
    const absolute = toAbsolute(path)
    const relative = toRelative(absolute)
    if (relative.length === 0) {
      throw new Error("Cannot write the VFS root")
    }
    volume.mkdirSync(dirnamePosix(absolute), { recursive: true })
    volume.writeFileSync(absolute, content)
    if (sourcePath !== undefined) sourcePaths.set(relative, sourcePath)
    else sourcePaths.delete(relative)
  }

  const readFile = (path: string): string => volume.readFileSync(toAbsolute(path), "utf8")

  const exists = (path: string): boolean => volume.existsSync(toAbsolute(path))

  const fileExists = (path: string): boolean => {
    const absolute = toAbsolute(path)
    if (!volume.existsSync(absolute)) return false
    return volume.statSync(absolute).isFile()
  }

  const directoryExists = (path: string): boolean => {
    const absolute = toAbsolute(path)
    if (!volume.existsSync(absolute)) return false
    return volume.statSync(absolute).isDirectory()
  }

  const readJson = <T = unknown>(path: string): T => JSON.parse(readFile(path)) as T

  const writeJson = (path: string, value: unknown): void => {
    writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
  }

  const deleteFile = (path: string): void => {
    const absolute = toAbsolute(path)
    if (volume.existsSync(absolute)) volume.unlinkSync(absolute)
    sourcePaths.delete(toRelative(absolute))
  }

  const walk = (absolute: string, files: Array<string>): void => {
    if (!volume.existsSync(absolute)) return
    const stat = volume.statSync(absolute)
    if (stat.isFile()) {
      const relative = toRelative(absolute)
      if (relative.length > 0) files.push(relative)
      return
    }
    if (!stat.isDirectory()) return
    for (const entry of volume.readdirSync(absolute)) {
      const name = typeof entry === "string" ? entry : new TextDecoder().decode(entry)
      const next = absolute === "/" ? `/${name}` : `${absolute}/${name}`
      walk(next, files)
    }
  }

  const getAllFiles = (): ReadonlyArray<string> => {
    const files: Array<string> = []
    walk("/", files)
    files.sort((a, b) => a.localeCompare(b))
    return files
  }

  const getFileCount = (): number => getAllFiles().length

  const toTree = (rootName: string): VirtualDirNode => {
    const root: MutableDir = { type: "directory", name: rootName, children: [] }
    for (const relative of getAllFiles()) {
      const parts = relative.split("/")
      let directory = root
      for (let index = 0; index < parts.length - 1; index++) {
        const name = parts[index]
        if (name === undefined) continue
        let next = directory.children.find((child) => child.type === "directory" && child.name === name) as
          | MutableDir
          | undefined
        if (next === undefined) {
          next = { type: "directory", name, children: [] }
          directory.children.push(next)
        }
        directory = next
      }
      const name = parts[parts.length - 1]
      if (name === undefined) continue
      const sourcePath = sourcePaths.get(relative)
      const file: VirtualFileNode = sourcePath === undefined
        ? { type: "file", name, content: readFile(relative) }
        : { type: "file", name, content: readFile(relative), sourcePath }
      directory.children.push(file)
    }
    sortDirectory(root)
    return root
  }

  return VirtualFs.of({
    writeFile,
    readFile,
    exists,
    fileExists,
    directoryExists,
    readJson,
    writeJson,
    deleteFile,
    getAllFiles,
    getFileCount,
    toTree
  })
}

const sortDirectory = (directory: MutableDir): void => {
  directory.children.sort((a, b) => a.name.localeCompare(b.name))
  for (const child of directory.children) {
    if (child.type === "directory") sortDirectory(child as MutableDir)
  }
}

/** Seed text files into a VFS. `add` will reuse this; create does not. */
export const seedTextFiles = (
  files: ReadonlyArray<{ readonly path: string; readonly content: string }>
): VirtualFsService => {
  const vfs = makeMemVirtualFs()
  for (const file of files) vfs.writeFile(file.path, file.content)
  return vfs
}

export const countTree = (
  node: VirtualDirNode
): { readonly fileCount: number; readonly directoryCount: number } => {
  let fileCount = 0
  let directoryCount = 1
  for (const child of node.children) {
    if (child.type === "file") fileCount++
    else {
      const nested = countTree(child)
      fileCount += nested.fileCount
      directoryCount += nested.directoryCount
    }
  }
  return { fileCount, directoryCount }
}

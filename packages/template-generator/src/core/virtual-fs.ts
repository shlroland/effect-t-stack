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
 * In-memory project tree. `generate` is browser-safe: this module does not read or write the disk.
 * Paths are absolute inside memfs and relative everywhere callers see them.
 */
export class VirtualFileSystem {
  private readonly volume: MemVolume
  private readonly sourcePaths = new Map<string, string>()

  constructor() {
    this.volume = new Volume() as unknown as MemVolume
  }

  writeFile(path: string, content: string, sourcePath?: string): void {
    const absolute = toAbsolute(path)
    const relative = toRelative(absolute)
    if (relative.length === 0) {
      throw new Error("Cannot write the VFS root")
    }
    this.volume.mkdirSync(dirnamePosix(absolute), { recursive: true })
    this.volume.writeFileSync(absolute, content)
    if (sourcePath !== undefined) this.sourcePaths.set(relative, sourcePath)
    else this.sourcePaths.delete(relative)
  }

  readFile(path: string): string {
    return this.volume.readFileSync(toAbsolute(path), "utf8")
  }

  exists(path: string): boolean {
    return this.volume.existsSync(toAbsolute(path))
  }

  fileExists(path: string): boolean {
    const absolute = toAbsolute(path)
    if (!this.volume.existsSync(absolute)) return false
    return this.volume.statSync(absolute).isFile()
  }

  directoryExists(path: string): boolean {
    const absolute = toAbsolute(path)
    if (!this.volume.existsSync(absolute)) return false
    return this.volume.statSync(absolute).isDirectory()
  }

  readJson<T = unknown>(path: string): T {
    return JSON.parse(this.readFile(path)) as T
  }

  writeJson(path: string, value: unknown): void {
    this.writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
  }

  deleteFile(path: string): void {
    const absolute = toAbsolute(path)
    if (this.volume.existsSync(absolute)) this.volume.unlinkSync(absolute)
    this.sourcePaths.delete(toRelative(absolute))
  }

  getAllFiles(): ReadonlyArray<string> {
    const files: Array<string> = []
    this.walk("/", files)
    files.sort((a, b) => a.localeCompare(b))
    return files
  }

  getFileCount(): number {
    return this.getAllFiles().length
  }

  toTree(rootName: string): VirtualDirNode {
    const root: MutableDir = { type: "directory", name: rootName, children: [] }
    for (const relative of this.getAllFiles()) {
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
      const sourcePath = this.sourcePaths.get(relative)
      const file: VirtualFileNode = sourcePath === undefined
        ? { type: "file", name, content: this.readFile(relative) }
        : { type: "file", name, content: this.readFile(relative), sourcePath }
      directory.children.push(file)
    }
    sortDirectory(root)
    return root
  }

  private walk(absolute: string, files: Array<string>): void {
    if (!this.volume.existsSync(absolute)) return
    const stat = this.volume.statSync(absolute)
    if (stat.isFile()) {
      const relative = toRelative(absolute)
      if (relative.length > 0) files.push(relative)
      return
    }
    if (!stat.isDirectory()) return
    for (const entry of this.volume.readdirSync(absolute)) {
      const name = typeof entry === "string" ? entry : new TextDecoder().decode(entry)
      const next = absolute === "/" ? `/${name}` : `${absolute}/${name}`
      this.walk(next, files)
    }
  }
}

const sortDirectory = (directory: MutableDir): void => {
  directory.children.sort((a, b) => a.name.localeCompare(b.name))
  for (const child of directory.children) {
    if (child.type === "directory") sortDirectory(child as MutableDir)
  }
}

export const createVirtualFileSystem = (): VirtualFileSystem => new VirtualFileSystem()

/** Seed text files into a VFS. `add` will reuse this; create does not. */
export const seedTextFiles = (
  files: ReadonlyArray<{ readonly path: string; readonly content: string }>
): VirtualFileSystem => {
  const vfs = createVirtualFileSystem()
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

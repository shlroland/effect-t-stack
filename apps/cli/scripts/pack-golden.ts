#!/usr/bin/env bun
/**
 * Copy examples/golden → apps/cli/templates/golden for npm pack/publish.
 * Applies the same denylist as create (no node_modules, repos, .cursor, …).
 */
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { isDeniedName } from "../src/template/denylist.ts"

const here = dirname(fileURLToPath(import.meta.url))
const cliRoot = join(here, "..")
const repoRoot = join(cliRoot, "../..")
const sourceRoot = join(repoRoot, "examples/golden")
const destRoot = join(cliRoot, "templates/golden")

const walkCopy = async (srcDir: string, destDir: string): Promise<number> => {
  await mkdir(destDir, { recursive: true })
  let count = 0
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    if (isDeniedName(entry.name)) {
      continue
    }
    const from = join(srcDir, entry.name)
    const to = join(destDir, entry.name)
    if (entry.isDirectory()) {
      count += await walkCopy(from, to)
      continue
    }
    if (entry.isFile() || entry.isSymbolicLink()) {
      const info = await stat(from).catch(() => undefined)
      if (info?.isFile()) {
        await cp(from, to)
        count += 1
      }
    }
  }
  return count
}

const main = async () => {
  const goldenPkg = join(sourceRoot, "package.json")
  if (!(await stat(goldenPkg).then(() => true, () => false))) {
    throw new Error(`Golden Sample missing at ${sourceRoot}`)
  }
  await rm(destRoot, { recursive: true, force: true })
  const files = await walkCopy(sourceRoot, destRoot)
  console.log(`Packed ${files} files → ${relative(repoRoot, destRoot)}`)
}

await main()

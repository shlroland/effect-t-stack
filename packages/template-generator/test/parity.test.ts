import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"

import { generateDefault, readTreeFile, treePaths } from "./support.ts"

const goldenRoot = join(resolve(import.meta.dir, "../../.."), "examples/golden")

const SKIP_DIRECTORIES = new Set(["node_modules", ".git", ".turbo", "dist", "coverage", "repos"])

/**
 * Extraction aid: the default generate should cover the same Golden Sample paths.
 * Generator-owned files (README, gitignore, computed .env) are not in golden.
 * `bun.lock` is produced by install, not by the generator.
 */
const GENERATOR_ONLY = new Set([
  ".gitignore",
  "README.md",
  "apps/web/.env",
  "apps/server/.env"
])

const walk = (root: string): Array<string> => {
  const files: Array<string> = []
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      const absolute = join(directory, name)
      const stat = statSync(absolute)
      if (stat.isSymbolicLink()) continue
      if (stat.isDirectory()) {
        if (SKIP_DIRECTORIES.has(name)) continue
        visit(absolute)
        continue
      }
      if (!stat.isFile()) continue
      if (name === "bun.lock") continue
      files.push(relative(root, absolute).split("\\").join("/"))
    }
  }
  visit(root)
  files.sort((a, b) => a.localeCompare(b))
  return files
}

const packageNames = (paths: ReadonlyArray<string>, read: (path: string) => string): Array<string> =>
  paths
    .filter((path) => path.endsWith("package.json"))
    .map((path) => (JSON.parse(read(path)) as { name: string }).name)
    .sort((left, right) => left.localeCompare(right))

describe("golden structural parity", () => {
  test("default generate has the same paths and workspace package names", () => {
    const tree = generateDefault("smoke", undefined, "0.1.0")
    const generated = treePaths(tree).filter((path) => !GENERATOR_ONLY.has(path))
    const golden = walk(goldenRoot)
    expect(generated).toEqual(golden)

    const goldenNames = packageNames(golden, (path) => readFileSync(join(goldenRoot, path), "utf8")).map((name) =>
      name.replaceAll("@ets/", "@smoke/").replace(/^effect-t-stack-golden$/, "smoke")
    )
    const generatedNames = packageNames(treePaths(tree), (path) => readTreeFile(tree, path))
    expect(generatedNames).toEqual(goldenNames)
  })
})

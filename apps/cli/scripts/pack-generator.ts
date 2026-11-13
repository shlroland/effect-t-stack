#!/usr/bin/env bun
/**
 * Copy packages/template-generator into apps/cli/templates/template-generator
 * so a packed CLI can generate from the embedded templates.
 */
import { spawn } from "node:child_process"
import { cp, mkdir, rm } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const cliRoot = join(here, "..")
const repoRoot = join(cliRoot, "../..")
const sourceRoot = join(repoRoot, "packages/template-generator")
const destRoot = join(cliRoot, "templates/template-generator")

const run = (command: string, argv: ReadonlyArray<string>, cwd: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...argv], { cwd, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${argv.join(" ")} => ${code}`))
    })
  })

const main = async () => {
  await run("bun", ["run", "prebuild"], sourceRoot)
  await rm(destRoot, { recursive: true, force: true })
  await mkdir(destRoot, { recursive: true })
  for (const name of ["package.json", "README.md", "src", "templates"]) {
    await cp(join(sourceRoot, name), join(destRoot, name), { recursive: true })
  }
  console.log(`Packed template-generator → ${relative(repoRoot, destRoot)}`)
}

await main()

#!/usr/bin/env bun
/**
 * Copy packages/template-generator into apps/cli/templates/template-generator
 * so a packed CLI can generate from the embedded templates.
 *
 * Runtime deps of the embedded generator (`memfs`, `handlebars`, `effect`) must
 * also be listed on `create-effect-t-stack` itself — bunx/npx only install the
 * CLI package, not this nested package.json.
 */
import { spawn } from "node:child_process"
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
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

const rewriteEmbeddedPackageJson = async () => {
  const cliPkg = JSON.parse(await readFile(join(cliRoot, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>
  }
  const embeddedPath = join(destRoot, "package.json")
  const embedded = JSON.parse(await readFile(embeddedPath, "utf8")) as {
    private?: boolean
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const cliDeps = cliPkg.dependencies ?? {}
  const nextDeps: Record<string, string> = {}
  for (const [name, range] of Object.entries(embedded.dependencies ?? {})) {
    nextDeps[name] = range === "catalog:" ? (cliDeps[name] ?? range) : range
  }
  embedded.dependencies = nextDeps
  delete embedded.devDependencies
  embedded.private = true
  await writeFile(embeddedPath, `${JSON.stringify(embedded, null, 2)}\n`)
}

const main = async () => {
  await run("bun", ["run", "prebuild"], sourceRoot)
  await rm(destRoot, { recursive: true, force: true })
  await mkdir(destRoot, { recursive: true })
  for (const name of ["package.json", "README.md", "src", "templates"]) {
    await cp(join(sourceRoot, name), join(destRoot, name), { recursive: true })
  }
  await rewriteEmbeddedPackageJson()
  console.log(`Packed template-generator → ${relative(repoRoot, destRoot)}`)
}

await main()

import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { compileTemplate } from "../src/core/template-processor.ts"
import { loadTemplates } from "../src/core/template-reader.ts"
import { seedTextFiles } from "../src/core/virtual-fs.ts"
import { projectConfig } from "../src/default-config.ts"
import { writeTree } from "../src/fs-writer.ts"
import { generate } from "../src/generator.ts"
import { EMBEDDED_TEMPLATES, TEMPLATE_COUNT } from "../src/templates.generated.ts"
import type { VirtualFileTree } from "../src/types.ts"
import { addPackageDependency } from "../src/utils/add-deps.ts"
import { dependencyVersionMap } from "../src/utils/dependency-versions.ts"
import { generateDefault, parseJsonc, readTreeFile, treePaths } from "./support.ts"

const repoRoot = resolve(import.meta.dir, "../../..")
const source = (relativePath: string): string => readFileSync(new URL(relativePath, import.meta.url), "utf8")

describe("template generator contract", () => {
  test("refuses an empty template map", () => {
    const result = generate({ config: projectConfig("smoke"), templates: new Map() })
    expect(result._tag).toBe("Failure")
    if (result._tag === "Failure") expect(result.error.phase).toBe("initialization")
  })

  test("refuses stacks other than the Golden default cell", () => {
    const result = generate({
      config: projectConfig("smoke", { api: "httpapi" }),
      templates: EMBEDDED_TEMPLATES
    })
    expect(result._tag).toBe("Failure")
    if (result._tag === "Failure") {
      expect(result.error.phase).toBe("initialization")
      expect(result.error.message).toContain("api=httpapi")
    }
  })

  test("refuses a project name that is not an npm scope segment", () => {
    const result = generate({ config: projectConfig("My App"), templates: EMBEDDED_TEMPLATES })
    expect(result._tag).toBe("Failure")
  })

  test("handlebars helpers see the project config", () => {
    const config = projectConfig("smoke")
    expect(compileTemplate("{{#if (eq api \"rpc\")}}yes{{else}}no{{/if}}", config)).toBe("yes")
    expect(compileTemplate("{{#if (ne auth \"none\")}}yes{{else}}no{{/if}}", config)).toBe("no")
    expect(
      compileTemplate(
        "{{#if (and (eq orm \"drizzle\") (includes frontend \"tanstack-start\"))}}yes{{else}}no{{/if}}",
        config
      )
    ).toBe("yes")
    expect(compileTemplate("{{#if (or (eq runtime \"node\") (eq runtime \"bun\"))}}yes{{/if}}", config)).toBe("yes")
    expect(compileTemplate("{{#if (not (eq database \"none\"))}}yes{{else}}no{{/if}}", config)).toBe("yes")
  })

  test("generate does not import node:fs; writeTree does", () => {
    expect(source("../src/generator.ts").includes("node:fs")).toBe(false)
    expect(source("../src/core/virtual-fs.ts").includes("node:fs")).toBe(false)
    expect(source("../src/index.ts").includes("fs-writer")).toBe(false)
    expect(source("../src/fs-writer.ts").includes("node:fs")).toBe(true)
  })

  test("embedded templates match the templates directory", () => {
    const fromDisk = loadTemplates()
    expect(TEMPLATE_COUNT).toBe(fromDisk.size)
    expect(TEMPLATE_COUNT).toBe(EMBEDDED_TEMPLATES.size)
    expect([...EMBEDDED_TEMPLATES.keys()].sort()).toEqual([...fromDisk.keys()].sort())
  })

  test("dependencyVersionMap matches the Golden Sample catalog", () => {
    const golden = JSON.parse(readFileSync(join(repoRoot, "examples/golden/package.json"), "utf8")) as {
      workspaces: { catalog: Record<string, string> }
    }
    const pins: Record<string, string> = dependencyVersionMap
    expect(Object.keys(pins).sort()).toEqual(Object.keys(golden.workspaces.catalog).sort())
    for (const [name, version] of Object.entries(golden.workspaces.catalog)) {
      expect(pins[name]).toBe(version)
    }
  })

  test("missing pins throw instead of inventing a version", () => {
    const vfs = seedTextFiles([{ path: "package.json", content: "{}\n" }])
    expect(() => addPackageDependency({ vfs, packagePath: "", dependencies: ["not-a-real-package"] })).toThrow(
      /dependencyVersionMap/
    )
  })

  test("default generate rewrites scope, catalogs shared pins, and stamps ets.jsonc", () => {
    const tree = generateDefault("smoke", undefined, "0.1.0")
    expect(tree.fileCount).toBeGreaterThan(40)
    expect(tree.config.projectName).toBe("smoke")

    for (const relativePath of treePaths(tree)) {
      const content = readTreeFile(tree, relativePath)
      expect(content.includes("@ets/")).toBe(false)
    }

    const repository = readTreeFile(tree, "packages/db/src/TodosRepository.ts")
    expect(repository).toContain("@smoke/domain")

    const domain = JSON.parse(readTreeFile(tree, "packages/domain/package.json")) as {
      name: string
      dependencies: Record<string, string>
    }
    expect(domain.name).toBe("@smoke/domain")
    expect(domain.dependencies["effect"]).toBe("catalog:")

    const root = JSON.parse(readTreeFile(tree, "package.json")) as {
      name: string
      packageManager: string
      scripts: Record<string, string>
      workspaces: { catalog: Record<string, string> }
    }
    expect(root.name).toBe("smoke")
    expect(root.packageManager).toBe("bun@1.4.4")
    expect(root.scripts["dev"]).toBe("turbo run dev --filter=@smoke/web")
    expect(root.scripts["prepare"]).toBe("effect-language-service patch && lefthook install")
    expect(root.workspaces.catalog["effect"]).toBe(dependencyVersionMap.effect)
    expect(root.workspaces.catalog["typescript"]).toBe(dependencyVersionMap.typescript)

    const web = JSON.parse(readTreeFile(tree, "apps/web/package.json")) as {
      name: string
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    expect(web.name).toBe("@smoke/web")
    expect(web.dependencies["@smoke/server"]).toBe("workspace:*")
    expect(web.devDependencies["vite"]).toBe(dependencyVersionMap.vite)

    assertPins(tree, root.workspaces.catalog)

    const fingerprint = parseJsonc(readTreeFile(tree, "ets.jsonc"))
    expect(fingerprint["api"]).toBe("rpc")
    expect(fingerprint["database"]).toBe("sqlite")
    expect(fingerprint["orm"]).toBe("drizzle")
    expect(fingerprint["auth"]).toBe("none")
    expect(fingerprint["frontend"]).toBe("tanstack-start")
    expect(fingerprint["backend"]).toBe("self")
    expect(fingerprint["name"]).toBe("smoke")
    expect(fingerprint["cliVersion"]).toBe("0.1.0")
    expect(fingerprint["examples"]).toEqual(["todo"])
    expect(fingerprint["addons"]).toContain("effect-style")
    const apiOptions = fingerprint["apiOptions"] as { import: string; secondary: { api: string; import: string } }
    expect(apiOptions.import).toBe("@smoke/protocol/rpc")
    expect(apiOptions.secondary.api).toBe("httpapi")
    expect(apiOptions.secondary.import).toBe("@smoke/protocol/http-api")
    expect(fingerprint["reproducibleCommand"]).toBe("bunx create-effect-t-stack@0.1.0 smoke --yes")
  })

  test("effect-oxc template matches the owned package and lint does not load repos/effect", () => {
    const owned = join(repoRoot, "packages/effect-oxc/src/oxlint")
    const copied = join(
      repoRoot,
      "packages/template-generator/templates/addons/effect-style/packages/effect-oxc/src/oxlint"
    )
    const files = [
      "index.ts",
      "rules/no-bigint-literals.ts",
      "rules/no-import-from-barrel-package.ts",
      "rules/no-js-extension-imports.ts",
      "rules/no-opaque-instance-fields.ts",
      "rules/no-unused-internal.ts"
    ]
    for (const file of files) {
      expect(readFileSync(join(copied, file), "utf8")).toBe(readFileSync(join(owned, file), "utf8"))
    }
    const tree = generateDefault("smoke", undefined, "0.1.0")
    const oxlintrc = readTreeFile(tree, ".oxlintrc.json")
    expect(oxlintrc).toContain("./packages/effect-oxc/src/oxlint/index.ts")
    expect(oxlintrc).not.toContain("repos/effect")
    const fingerprint = readTreeFile(tree, "ets.jsonc")
    expect(fingerprint).not.toContain("repos/effect/packages/tools/oxc")
    expect(fingerprint).toContain("packages/effect-oxc")
  })

  test("omits ets.jsonc when no CLI version is passed", () => {
    const tree = generateDefault("smoke")
    expect(treePaths(tree).includes("ets.jsonc")).toBe(false)
  })

  test("npm keeps explicit pins and skips the catalog", () => {
    const tree = generateDefault("smoke", { packageManager: "npm" }, "0.1.0")
    const domain = JSON.parse(readTreeFile(tree, "packages/domain/package.json")) as {
      dependencies: Record<string, string>
    }
    const protocol = JSON.parse(readTreeFile(tree, "packages/protocol/package.json")) as {
      dependencies: Record<string, string>
    }
    const root = JSON.parse(readTreeFile(tree, "package.json")) as { workspaces: unknown }
    expect(domain.dependencies["effect"]).toBe(dependencyVersionMap.effect)
    expect(protocol.dependencies["@smoke/domain"]).toBe("*")
    expect(root.workspaces).toEqual(["apps/*", "packages/*"])
    expect(treePaths(tree).includes("pnpm-workspace.yaml")).toBe(false)
  })

  test("pnpm writes a workspace catalog", () => {
    const tree = generateDefault("smoke", { packageManager: "pnpm" })
    const yaml = readTreeFile(tree, "pnpm-workspace.yaml")
    expect(yaml).toContain("\"effect\"")
    expect(yaml).toContain(dependencyVersionMap.effect)
    const domain = JSON.parse(readTreeFile(tree, "packages/domain/package.json")) as {
      dependencies: Record<string, string>
    }
    expect(domain.dependencies["effect"]).toBe("catalog:")
    const root = JSON.parse(readTreeFile(tree, "package.json")) as { workspaces?: unknown }
    expect(root.workspaces).toBeUndefined()
  })

  test("writeTree materializes the project directory", async () => {
    const tree = generateDefault("smoke", undefined, "0.1.0")
    const directory = await mkdtemp(join(tmpdir(), "ets-write-"))
    try {
      await writeTree(tree, directory)
      const pkg = JSON.parse(await readFile(join(directory, "package.json"), "utf8")) as { name: string }
      expect(pkg.name).toBe("smoke")
      const todo = await readFile(join(directory, "packages/domain/src/Todo.ts"), "utf8")
      expect(todo.includes("@ets/")).toBe(false)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  test("seedTextFiles loads an existing project into a VFS", () => {
    const vfs = seedTextFiles([{ path: "package.json", content: "{\"name\":\"kept\"}\n" }])
    expect(vfs.readFile("package.json")).toContain("kept")
  })
})

const assertPins = (tree: VirtualFileTree, catalog: Record<string, string>): void => {
  for (const relativePath of treePaths(tree).filter((path) => path.endsWith("package.json"))) {
    const pkg = JSON.parse(readTreeFile(tree, relativePath)) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    for (const section of [pkg.dependencies, pkg.devDependencies]) {
      if (section === undefined) continue
      for (const [name, version] of Object.entries(section)) {
        if (version === "workspace:*" || version === "*") continue
        if (version === "catalog:") {
          expect(catalog[name]).toBe(dependencyVersionMap[name as keyof typeof dependencyVersionMap])
          continue
        }
        expect(version).toBe(dependencyVersionMap[name as keyof typeof dependencyVersionMap])
      }
    }
  }
}

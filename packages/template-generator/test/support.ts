import { projectConfig } from "../src/default-config.ts"
import { generate } from "../src/generator.ts"
import { EMBEDDED_TEMPLATES } from "../src/templates.generated.ts"
import type { ProjectConfig, VirtualFileTree, VirtualNode } from "../src/types.ts"

export const generateDefault = (
  name: string,
  patch?: Partial<Omit<ProjectConfig, "projectName">>,
  version?: string
): VirtualFileTree => {
  const result = generate({
    config: projectConfig(name, patch),
    templates: EMBEDDED_TEMPLATES,
    ...(version === undefined ? {} : { version })
  })
  if (result._tag === "Failure") {
    throw new Error(`${result.error.phase}: ${result.error.message}`)
  }
  return result.value
}

export const readTreeFile = (tree: VirtualFileTree, relativePath: string): string => {
  const parts = relativePath.split("/")
  let node: VirtualNode = tree.root
  for (const part of parts) {
    if (node.type !== "directory") throw new Error(`${relativePath} is not a directory path`)
    const next: VirtualNode | undefined = node.children.find((child) => child.name === part)
    if (next === undefined) throw new Error(`missing ${relativePath}`)
    node = next
  }
  if (node.type !== "file") throw new Error(`${relativePath} is not a file`)
  return node.content
}

export const treePaths = (tree: VirtualFileTree): Array<string> => {
  const paths: Array<string> = []
  const visit = (node: VirtualNode, prefix: string): void => {
    const next = prefix.length === 0 ? node.name : `${prefix}/${node.name}`
    if (node.type === "file") {
      paths.push(next)
      return
    }
    for (const child of node.children) visit(child, next)
  }
  for (const child of tree.root.children) visit(child, "")
  paths.sort((a, b) => a.localeCompare(b))
  return paths
}

export const parseJsonc = (raw: string): Record<string, unknown> => {
  const json = raw.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n")
  return JSON.parse(json) as Record<string, unknown>
}

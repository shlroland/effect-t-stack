import {
  EMBEDDED_TEMPLATES,
  generate,
  type GenerateOptions,
  type GeneratorError,
  libraryProjectConfig,
  type ProjectConfig,
  projectConfig,
  type VirtualFileTree
} from "@effect-t-stack/template-generator"
import { writeTree } from "@effect-t-stack/template-generator/fs-writer"
import * as Effect from "effect/Effect"

export type GeneratorApi = {
  readonly generate: (
    options: GenerateOptions
  ) => Effect.Effect<VirtualFileTree, GeneratorError>
  readonly EMBEDDED_TEMPLATES: ReadonlyMap<string, string>
  readonly projectConfig: (
    projectName: string,
    patch?: Partial<Omit<ProjectConfig, "projectName">>
  ) => ProjectConfig
  readonly libraryProjectConfig: (
    projectName: string,
    patch?: Partial<Omit<ProjectConfig, "projectName" | "template">>
  ) => ProjectConfig
}

export type WriterApi = {
  readonly writeTree: typeof writeTree
}

/**
 * Static imports so the published Node bundle can inline the generator.
 * Dev checkouts resolve the workspace package the same way.
 */
export const loadGenerator: Effect.Effect<GeneratorApi> = Effect.succeed({
  generate,
  EMBEDDED_TEMPLATES,
  projectConfig,
  libraryProjectConfig
})

export const loadWriter: Effect.Effect<WriterApi> = Effect.succeed({
  writeTree
})

import type {
  GenerateOptions,
  GeneratorError,
  ProjectConfig,
  Result,
  VirtualFileTree
} from "@effect-t-stack/template-generator"

export type GeneratorApi = {
  readonly generate: (options: GenerateOptions) => Result<VirtualFileTree, GeneratorError>
  readonly EMBEDDED_TEMPLATES: ReadonlyMap<string, string>
  readonly projectConfig: (
    projectName: string,
    patch?: Partial<Omit<ProjectConfig, "projectName">>
  ) => ProjectConfig
}

export type WriterApi = {
  readonly writeTree: (tree: VirtualFileTree, projectDir: string) => Promise<void>
}

const asGenerator = (loaded: unknown): GeneratorApi => loaded as GeneratorApi

const asWriter = (loaded: unknown): WriterApi => loaded as WriterApi

/**
 * Monorepo resolves the workspace package. A packed CLI falls back to the
 * prepack copy under `templates/template-generator` (no dependency on examples/golden).
 */
export const loadGenerator = async (): Promise<GeneratorApi> => {
  try {
    return asGenerator(await import("@effect-t-stack/template-generator"))
  } catch (packageError) {
    const vendored = new URL("../../templates/template-generator/src/index.ts", import.meta.url).href
    try {
      return asGenerator(await import(vendored))
    } catch (vendoredError) {
      const message = packageError instanceof Error ? packageError.message : String(packageError)
      throw new Error(`template-generator unavailable (${message})`, { cause: vendoredError })
    }
  }
}

export const loadWriter = async (): Promise<WriterApi> => {
  try {
    return asWriter(await import("@effect-t-stack/template-generator/fs-writer"))
  } catch (packageError) {
    const vendored = new URL("../../templates/template-generator/src/fs-writer.ts", import.meta.url).href
    try {
      return asWriter(await import(vendored))
    } catch (vendoredError) {
      const message = packageError instanceof Error ? packageError.message : String(packageError)
      throw new Error(`template-generator writer unavailable (${message})`, { cause: vendoredError })
    }
  }
}

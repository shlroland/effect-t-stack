import type {
  GenerateOptions,
  GeneratorError,
  ProjectConfig,
  Result,
  VirtualFileTree
} from "@effect-t-stack/template-generator"
import * as Effect from "effect/Effect"
import { CreateError } from "../shared/CreateError.ts"

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

const causeMessage = (cause: unknown): string => cause instanceof Error ? cause.message : String(cause)

/**
 * Monorepo resolves the workspace package. A packed CLI falls back to the
 * prepack copy under `templates/template-generator`.
 */
export const loadGenerator: Effect.Effect<GeneratorApi, CreateError> = Effect.firstSuccessOf([
  Effect.tryPromise({
    try: () => import("@effect-t-stack/template-generator"),
    catch: (cause) => cause
  }),
  Effect.tryPromise({
    try: () => import(new URL("../../templates/template-generator/src/index.ts", import.meta.url).href),
    catch: (cause) => cause
  })
]).pipe(
  Effect.map(asGenerator),
  Effect.mapError((cause) =>
    new CreateError({
      message: `template-generator unavailable (${causeMessage(cause)})`
    })
  )
)

export const loadWriter: Effect.Effect<WriterApi, CreateError> = Effect.firstSuccessOf([
  Effect.tryPromise({
    try: () => import("@effect-t-stack/template-generator/fs-writer"),
    catch: (cause) => cause
  }),
  Effect.tryPromise({
    try: () => import(new URL("../../templates/template-generator/src/fs-writer.ts", import.meta.url).href),
    catch: (cause) => cause
  })
]).pipe(
  Effect.map(asWriter),
  Effect.mapError((cause) =>
    new CreateError({
      message: `template-generator writer unavailable (${causeMessage(cause)})`
    })
  )
)

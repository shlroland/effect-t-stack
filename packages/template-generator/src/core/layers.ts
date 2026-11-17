import * as Layer from "effect/Layer"

import { TemplateEngine } from "./template-engine.ts"
import { VirtualFs } from "./virtual-fs.ts"

/** Layers required by `generate` (in-memory VFS + Handlebars engine). */
export const GenerateLayers: Layer.Layer<VirtualFs | TemplateEngine> = Layer.mergeAll(
  VirtualFs.layer,
  TemplateEngine.layer
)

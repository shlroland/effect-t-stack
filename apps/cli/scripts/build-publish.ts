#!/usr/bin/env bun
/**
 * Bundle the CLI (+ workspace template-generator) to plain Node ESM under `dist/`.
 * Published `bin` points at `dist/bin.js` so `npx` works without Bun and without
 * loading `.ts` from `node_modules`.
 */
import { rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const outdir = join(cliRoot, "dist")
const entry = join(cliRoot, "src/bin.ts")

const main = async () => {
  await rm(outdir, { recursive: true, force: true })

  const result = await Bun.build({
    entrypoints: [entry],
    outdir,
    target: "node",
    format: "esm",
    sourcemap: "none",
    minify: false,
    naming: "bin.js",
    banner: "#!/usr/bin/env node",
    // Keep runtime deps external; inline the workspace template-generator.
    external: [
      "effect",
      /^effect\//,
      /^@effect\//,
      "memfs",
      "handlebars"
    ]
  })

  if (!result.success) {
    for (const log of result.logs) console.error(log)
    throw new Error("bun build failed")
  }

  console.log(`Built publish bundle → ${outdir}/bin.js`)
}

await main()

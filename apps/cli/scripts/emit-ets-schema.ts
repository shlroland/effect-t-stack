/**
 * Regenerate packaged `schemas/ets.schema.json` from Fingerprint Schema (SoT).
 * Run: `bun run scripts/emit-ets-schema.ts`
 */
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { fingerprintJsonSchema } from "../src/fingerprint/FingerprintSchema.ts"

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, "../schemas/ets.schema.json")
const schema = fingerprintJsonSchema()
writeFileSync(outPath, `${JSON.stringify(schema, null, 2)}\n`)
console.log(`Wrote ${outPath}`)

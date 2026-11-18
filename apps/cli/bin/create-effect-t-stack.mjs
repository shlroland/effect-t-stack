#!/usr/bin/env node
/**
 * Published bin entry. npm rejects `.ts` bin paths, and Node refuses type-stripping
 * under `node_modules`, so this wrapper always re-execs the TypeScript CLI with Bun.
 */
import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const entry = join(dirname(fileURLToPath(import.meta.url)), "../src/bin.ts")
const args = process.argv.slice(2)

const bun = spawnSync("bun", [entry, ...args], {
  stdio: "inherit",
  env: process.env
})

if (bun.error == null && bun.status != null) {
  process.exit(bun.status)
}

const detail = bun.error?.message ?? `status=${String(bun.status)}`
console.error(
  `create-effect-t-stack: Bun is required to run the published CLI (https://bun.sh).\n` +
    `Could not exec \`bun\`: ${detail}`
)
process.exit(1)

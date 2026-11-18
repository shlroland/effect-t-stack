#!/usr/bin/env node
/**
 * Published bin entry. npm rejects `.ts` bin paths; Node also refuses type-stripping
 * under `node_modules`. Prefer Bun for the TypeScript CLI entry; fall back to Node
 * only when Bun is unavailable (Node 24+ may still fail on node_modules .ts).
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

const node = spawnSync(process.execPath, ["--experimental-strip-types", entry, ...args], {
  stdio: "inherit",
  env: process.env
})

if (node.error == null && node.status != null) {
  process.exit(node.status)
}

console.error(
  "create-effect-t-stack: could not start CLI. Install Bun (https://bun.sh) and retry, or use Node ≥ 24 with Bun on PATH."
)
process.exit(1)

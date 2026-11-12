#!/usr/bin/env bun
/**
 * Mechanical guard: CLI tests must live under test/ (bun test test).
 * Any *.test.ts under src/ is invisible to `check` and must fail the build.
 */
import { Glob } from "bun"
import * as path from "node:path"

const cliRoot = path.resolve(import.meta.dir, "..")
const hits: Array<string> = []

for await (const match of new Glob("src/**/*.test.ts").scan({ cwd: cliRoot, absolute: true })) {
  hits.push(path.relative(cliRoot, match))
}

if (hits.length > 0) {
  console.error("CLI tests must live under test/, found under src/:")
  for (const hit of hits) {
    console.error(`  - ${hit}`)
  }
  process.exit(1)
}

console.log("assert:test-layout ok (no src/**/*.test.ts)")

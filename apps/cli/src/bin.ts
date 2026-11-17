#!/usr/bin/env node
/**
 * Published entry for `npx` / `pnpm dlx` / `bunx`.
 * D1=b: Bun process → BunServices; otherwise NodeServices.
 * Scaffold Product local checkouts still develop/test under Bun (D3).
 */
import * as Command from "effect/cli/Command"
import * as Effect from "effect/Effect"
import { createEffectTStack } from "./Cli.ts"
import { cliVersion } from "./fingerprint/cliVersion.ts"
import { normalizeArgv } from "./normalizeArgv.ts"

const argv = normalizeArgv(process.argv.slice(2))

const program = cliVersion().pipe(
  Effect.flatMap((version) => Command.runWith(createEffectTStack, { version })(argv))
)

const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined"

if (isBun) {
  const BunRuntime = await import("@effect/platform-bun/BunRuntime")
  const BunServices = await import("@effect/platform-bun/BunServices")
  BunRuntime.runMain(program.pipe(Effect.provide(BunServices.layer)))
} else {
  const NodeRuntime = await import("@effect/platform-node/NodeRuntime")
  const NodeServices = await import("@effect/platform-node/NodeServices")
  NodeRuntime.runMain(program.pipe(Effect.provide(NodeServices.layer)))
}

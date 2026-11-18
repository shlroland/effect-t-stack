#!/usr/bin/env bun
/**
 * CLI entry. Published installs go through `bin/create-effect-t-stack.mjs`, which
 * re-execs this file with Bun. Local Scaffold Product checkouts also run under Bun.
 * D1=b: Bun process → BunServices; otherwise NodeServices.
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

#!/usr/bin/env bun
import * as BunRuntime from "@effect/platform-bun/BunRuntime"
import * as BunServices from "@effect/platform-bun/BunServices"
import * as Command from "effect/cli/Command"
import * as Effect from "effect/Effect"
import { createEffectTStack } from "./Cli.ts"
import { CLI_VERSION } from "./fingerprint/cliVersion.ts"
import { normalizeArgv } from "./normalizeArgv.ts"

const argv = normalizeArgv(process.argv.slice(2))

const program = Command.runWith(createEffectTStack, { version: CLI_VERSION })(argv).pipe(
  Effect.provide(BunServices.layer)
)

BunRuntime.runMain(program)

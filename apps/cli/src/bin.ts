#!/usr/bin/env bun
import * as BunRuntime from "@effect/platform-bun/BunRuntime"
import * as BunServices from "@effect/platform-bun/BunServices"
import * as Command from "effect/cli/Command"
import * as Effect from "effect/Effect"
import { createEffectTStack } from "./Cli.ts"

const program = Command.run(createEffectTStack, { version: "0.1.0" }).pipe(
  Effect.provide(BunServices.layer)
)

BunRuntime.runMain(program)

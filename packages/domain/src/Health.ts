import { Schema } from "effect"

export class HealthResponse extends Schema.Class<HealthResponse>("HealthResponse")({
  status: Schema.Literal("ok")
}) {}

export class ReadyResponse extends Schema.Class<ReadyResponse>("ReadyResponse")({
  status: Schema.Literal("ready")
}) {}

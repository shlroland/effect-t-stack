import { Schema } from "effect"

/** Wire DTO for liveness — not a domain entity. */
export class HealthResponse extends Schema.Class<HealthResponse>("HealthResponse")({
  status: Schema.Literal("ok")
}) {}

/** Wire DTO for readiness — not a domain entity. */
export class ReadyResponse extends Schema.Class<ReadyResponse>("ReadyResponse")({
  status: Schema.Literal("ready")
}) {}

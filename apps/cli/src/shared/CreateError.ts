import * as Schema from "effect/Schema"

/** CLI domain error — Schema.TaggedError so agents/tests can match `_tag` + decode. */
export class CreateError extends Schema.TaggedError<CreateError>()("CreateError", {
  message: Schema.String
}) {}

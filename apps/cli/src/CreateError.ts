import { Data } from "effect"

export class CreateError extends Data.TaggedError("CreateError")<{
  readonly message: string
}> {}

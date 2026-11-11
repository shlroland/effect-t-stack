import { HttpApi, OpenApi } from "effect/http-api"
import { SystemApiGroup } from "./SystemApi.ts"
import { TodosApiGroup } from "./TodosApi.ts"

/** Single mount prefix for HttpApi (+ OpenAPI / docs) under TanStack Start or Bun. */
export const ApiPrefix = "/rpc" as const

export class Api extends HttpApi.make("effect-t-stack")
  .add(SystemApiGroup)
  .add(TodosApiGroup)
  .prefix(ApiPrefix)
  .annotateMerge(OpenApi.annotations({
    title: "effect-t-stack API",
    description: "Effect v4 HttpApi golden base — Todo CRUD + health"
  }))
{}

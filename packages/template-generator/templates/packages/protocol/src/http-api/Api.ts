import { HttpApi, OpenApi } from "effect/http-api"
import { SystemApi } from "./SystemApi.ts"
import { TodosApiGroup } from "./TodosApi.ts"

/** Single mount prefix for HttpApi (+ OpenAPI / docs) under TanStack Start or Bun. */
export const ApiPrefix = "/api" as const

export class Api extends HttpApi.make("effect-t-stack")
  .add(SystemApi)
  .add(TodosApiGroup)
  .prefix(ApiPrefix)
  .annotateMerge(OpenApi.annotations({
    title: "effect-t-stack API",
    description: "Effect v4 HttpApi secondary surface — Todo CRUD + health (primary API is Rpc)"
  }))
{}

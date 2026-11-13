import { describe, expect, it } from "bun:test"
import { Layer } from "effect"
import { ApiClient } from "./http-api/ApiClient.ts"
import { AppRpcClient } from "./rpc/RpcClient.ts"

describe("client smoke", () => {
  it("exports HttpApi and Rpc client layers", () => {
    const http = ApiClient.layer("http://127.0.0.1:9")
    const rpc = AppRpcClient.layer("http://127.0.0.1:9")

    expect(Layer.isLayer(http)).toBe(true)
    expect(Layer.isLayer(rpc)).toBe(true)
  })
})

import { loadServerEnv } from "@ets/config"
import {
  createHttpApiWebHandler,
  createRpcWebHandler,
  isHttpApiRequestPath,
  isRpcRequestPath,
  makeAppLive
} from "@ets/server"
import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import { Layer } from "effect"
import { fileURLToPath } from "node:url"

const envFile = fileURLToPath(new URL("../.env", import.meta.url))
const env = loadServerEnv({ envFile })
const appLive = makeAppLive({
  databaseUrl: env.DATABASE_URL,
  port: env.PORT
})
const memoMap = Layer.makeMemoMapUnsafe()

const httpApi = createHttpApiWebHandler({ envFile, appLive, memoMap })
const rpc = createRpcWebHandler({ envFile, appLive, memoMap })

export default createServerEntry({
  fetch(request, opts) {
    const { pathname } = new URL(request.url)
    if (isHttpApiRequestPath(pathname)) {
      return httpApi.handler(request)
    }
    if (isRpcRequestPath(pathname)) {
      return rpc.handler(request)
    }
    return handler.fetch(request, opts)
  }
})

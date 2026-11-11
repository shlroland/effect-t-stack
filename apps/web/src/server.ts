import { createApiWebHandler, isApiRequestPath } from "@ets/server"
import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import { fileURLToPath } from "node:url"

const envFile = fileURLToPath(new URL("../.env", import.meta.url))

const api = createApiWebHandler({
  envFile
})

export default createServerEntry({
  fetch(request, opts) {
    const { pathname } = new URL(request.url)
    if (isApiRequestPath(pathname)) {
      return api.handler(request)
    }
    return handler.fetch(request, opts)
  }
})

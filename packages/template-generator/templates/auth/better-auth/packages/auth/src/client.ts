import { createAuthClient } from "better-auth/react"

/**
 * Browser Better Auth client (email/password via `/api/auth/*`).
 */
export const authClient = createAuthClient()
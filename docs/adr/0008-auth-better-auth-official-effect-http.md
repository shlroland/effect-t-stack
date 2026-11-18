# Auth: `@auth` package + Better Auth official Effect HTTP mount

## Status

Accepted (2026-11-18). Template overlays for `auth=better-auth` are **shipped** under `templates/auth/better-auth/**`. CLI `--auth better-auth` opens the cell; default `--yes` stays `auth=none`.

## Decision

1. **Independent workspace package** `@{{projectName}}/auth` when `auth=better-auth` (not Clerk in MVP). Default `--yes` stays `auth=none` (no `@auth` package).
2. **MVP integrates Better Auth via the [official Effect integration](https://www.better-auth.com/docs/integrations/effect):** mount `auth.handler` with `HttpEffect.fromWebHandler` (or the WinterCG `auth.handler` directly on Start’s `fetch`) under `/api/auth/*`.
3. **Effect Rpc stays primary for business APIs.** Sign-in / sign-up / cookie / OAuth stay on the HTTP auth surface. Protected Rpc procedures use `RpcMiddleware` → `auth.api.getSession({ headers })` → `CurrentUser`. They do **not** re-implement Better Auth over Rpc in MVP.
4. **Deferred:** Rpc-native `SignIn` / `SignUp` that forward `Set-Cookie` onto the Rpc HTTP response envelope; Clerk; OAuth providers; `payments=polar`; `add auth`; per-user Todo ownership.

## Package boundaries

| Package    | Role when `auth=better-auth`                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `@auth`    | `betterAuth(...)` instance, `auth.handler` route helper, `CurrentUser` + Rpc `AuthMiddleware`, web `createAuthClient` re-export |
| `@db`      | Drizzle auth tables / migrations (schema may re-export from `@auth` or merge via overlay)                                       |
| `@domain`  | Public `UserId` / session-facing types and `Unauthorized` (no better-auth types leak)                                           |
| `@server`  | Provide Auth Layer; mount auth routes on standalone server; Rpc handlers consume `CurrentUser`                                  |
| `apps/web` | Start dispatch: `/api/auth/*` before `/api` and `/rpc`; login / signup routes                                                   |

Effect Core spine becomes `domain | protocol | db | client | config | auth?` — see [`docs/golden-boundaries.md`](../golden-boundaries.md).

## Start dispatch order (`backend=self`)

1. `/api/auth/*` → Better Auth handler
2. `/api/*` → HttpApi (must not swallow `/api/auth`)
3. `/rpc` → Effect Rpc (+ AuthMiddleware on protected procedures)
4. else → TanStack Start

## MVP matrix cell

`better-auth` × `drizzle` × `sqlite` (then `postgres`) × `backend=self` × `tanstack-start` × `api=rpc` (HttpApi secondary). Email/password only.

## Template layout (when authored)

Prefix `templates/auth/better-auth/…` overlays `packages/auth`, `packages/db`, `apps/server`, and `apps/web`. Handler runs after frontend so it can replace `server.ts` and routes. Pins live only in `dependencyVersionMap`.

## Considered options

- **No `@auth` package** (split into domain/db/server only) — rejected: Better Auth instance, client, and middleware form one cohesion unit; matches BTS-shaped overlay without adopting BTS `packages/api`.
- **Rpc-only auth (no `/api/auth`)** — deferred: feasible via `auth.api.*` + HTTP middleware that merges `Set-Cookie` onto the Rpc response, but not the official path; OAuth/redirects still need HTTP.
- **Third-party `effectful-better-auth`** — rejected for MVP; prefer Better Auth’s documented Effect mount.

## Consequences

- CLI: `--auth none|better-auth` (default `none`). `clerk` stays in generator types only until a later cell.
- Compatibility: `better-auth` requires a real DB/ORM cell; no backend/no DB ⇒ `auth=none` (enforced when those dims exist).
- Generator `unsupportedStackMessage` allows `auth ∈ {none, better-auth}`. Overlay handler: `processAuthTemplates` (after frontend).
- Docs: Capability Tiers Auth checkboxes track remaining backlog (HttpApi gating, generated-build CI cell, OAuth, Rpc-native SignIn).

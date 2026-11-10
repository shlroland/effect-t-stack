# Effect Core first; BTS-parity via capability tiers; no Convex/self

We are aligning the Scaffold Product with Better-T-Stack’s surface (CLI, fingerprint, matrix, add, docs/agent) while keeping generated apps on an **Effect Core** spine (Effect v4, HttpApi default, domain → protocol → db → service → http, **Separate Server**). Delivery is ordered by **Capability Tier** L0–L6; other HTTP frameworks are only allowed later as **Backend Adapters** (max L6b). Convex and BTS `backend=self` are explicit non-goals so the Option Matrix does not fork away from Effect layering.

## Considered options

- Full BTS backend/API matrix (Hono/tRPC/Convex/self) — rejected: erases the Effect differentiator
- Fixed golden sample forever (no matrix) — rejected: cannot对标 BTS product
- Parallel API layers (tRPC/oRPC) as first-class — deferred/rejected as L6c non-goal

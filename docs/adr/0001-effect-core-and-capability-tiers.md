# Effect Core first; BTS-parity via capability tiers; no Convex/self

> **Superseded in part by [ADR-0006](./0006-api-primary-rpc-with-httpapi-secondary.md):** Effect Core `api` is `{httpapi, rpc}` with Golden/`--yes` default **`rpc`**; HttpApi remains a first-class secondary, not the sole default.

We are aligning the Scaffold Product with Better-T-Stack’s surface (CLI, fingerprint, matrix, add, docs/agent) while keeping generated apps on an **Effect Core** spine (Effect v4, `api ∈ {httpapi, rpc}` with Rpc as Golden default, domain → protocol → db → service → http/rpc, **Separate Server**). Delivery is ordered by **Capability Tier** L0–L6; other HTTP frameworks are only allowed later as **Backend Adapters** (max L6b). Convex and BTS `backend=self` are explicit non-goals so the Option Matrix does not fork away from Effect layering.

## Considered options

- Full BTS backend/API matrix (Hono/tRPC/Convex/self) — rejected: erases the Effect differentiator
- Fixed golden sample forever (no matrix) — rejected: cannot对标 BTS product
- Parallel API layers (tRPC/oRPC) as first-class — deferred/rejected as L6c non-goal

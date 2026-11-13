# API primary is Rpc; HttpApi stays secondary; CLI chooses primary later

Effect Core’s `api` dimension is `{httpapi, rpc}` with **primary label binding**: root `api`, default UI atoms/client, and the main protocol story follow the choice; the other surface may remain generated and mounted as **secondary** (not deleted). The `--yes` default is **`api=rpc`** (Todo UI via `AtomRpc` + `/rpc`); HttpApi under `/api` (OpenAPI/docs) stays secondary. This supersedes ADR-0001’s “HttpApi-only default” wording. CLI `--api` plumbing exists; the primary flip is backlog and does not change this default.

## Considered options

- Keep HttpApi as the only Effect Core default; Rpc forever secondary — rejected: golden UI already teaches Rpc and the product wants a first-class Rpc primary
- Mutual exclusion (generate only one API) — rejected for now: secondary mount remains useful (OpenAPI when Rpc-primary; Rpc when HttpApi-primary)
- Block L0 exit until create CLI can switch `--api` — rejected: collapses Capability Tiers; intent is enough for L0

## Consequences

- Fingerprint root `api` flips to `rpc`; HttpApi moves under `apiOptions.secondary`
- L3 Option Matrix reopens `api=rpc` (no longer “httpapi only until L6c”)
- tRPC/oRPC remain non-goals (L6c); this ADR only covers Effect HttpApi vs Effect Rpc

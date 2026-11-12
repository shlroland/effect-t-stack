# effect-t-stack

Vocabulary for the Effect full-stack scaffolder and the projects it generates.

## Language

**Golden Sample**:
The runnable default-stack monorepo under `examples/golden` that is the source of truth for what a `--yes` generated project should look like.
_Avoid_: demo app, starter only, example repo (when meaning the canonical base)

**Fingerprint**:
The project config file (`ets.jsonc`) that records stack choices so CLI create/add and agents can recognize and extend the project. It is versioned and periodically compacted; it is not an append-only notes file.
_Avoid_: lockfile, package.json, stack config (ambiguous), etc.jsonc

**L0 Exit**:
The explicit checklist that must pass (or be ADR-waived) before the Golden Sample may be copied by the Scaffold CLI.
_Avoid_: Phase 1a done, check passing (alone)

**Scaffold Product**:
The monorepo that ships the CLI, templates, docs, and agent surfaces used to create projects — not the user's generated app.
_Avoid_: template (alone), framework

**Option Matrix**:
The set of dimensions and allowed values users may pick at create/add time (runtime, database, auth, frontend, addons, …).
_Avoid_: feature list, roadmap

**Compatibility engine**:
The CLI module that rejects illegal create/add combinations in a fixed stage order (enums → combinations → auth/addons → examples), with active L2 gates and deferred L3 catalog rows.
_Avoid_: JSON Schema alone (insufficient for cross-field rules), Option Matrix (the surface; engine is the enforcer)

**Capability Tier**:
A staged delivery band (L0–L6) for Scaffold Product and generated-project features; higher tiers depend on lower ones.
_Avoid_: phase (unless tied to a named release), priority (alone)

**Effect Core**:
The fixed architectural spine of generated apps: Effect v4, `api ∈ {httpapi, rpc}` (Golden/`--yes` default `rpc`), and domain → protocol → db → service → http/rpc layering.
_Avoid_: backend (ambiguous), stack, HttpApi-only default (see ADR-0006)

**API Primary**:
The fingerprint root `api` value that binds the main protocol, default client, and default UI atoms; the other Effect API may remain mounted as secondary.
_Avoid_: exclusive API mode (when secondary is still generated), transport (alone)

**Backend Adapter**:
A thin HTTP host (e.g. Hono shell) that still runs Effect Core handlers/Layers — not a parallel API stack.
_Avoid_: backend (when meaning a full alternate stack), migration

**Separate Server**:
An optional generated shape with a dedicated `apps/server` process hosting Effect Rpc/HttpApi — distinct from BaaS; Golden default `backend=self` mounts APIs inside TanStack Start instead.
_Avoid_: Convex backend, fullstack web (when meaning API-in-`apps/web` without a clear mount)

**Dependency Catalog**:
The single table of version pins that Golden Sample and templates must use so generated projects stay on current stable releases by default.
_Avoid_: lockfile (alone), package.json ranges (as the source of truth)

**effect-style**:
An optional Fingerprint addon that enforces Effect-repo-aligned formatting, lint, and naming/API conventions; enabled by default in the Golden Sample.
_Avoid_: biome (as a synonym), lint addon (vague)

**mcp** (Fingerprint addon):
Coding-agent Effect docs MCP (`effect-mcp` / `effect-docs` in `.cursor/mcp.json`), default on in the Golden Sample. Optional nested `effectSolutions` is off by default and never outranks `repos/effect` or `AGENTS.md`. Distinct from Scaffold Product L5 Local MCP (create/plan).
_Avoid_: Scaffold Product MCP (when meaning L5), effect-solutions (as a synonym for the whole addon)

**Generated-build**:
A CI/scaffold test that materializes a real project from the generator and runs install/typecheck/test (or boot) on it — not a string snapshot of template output.
_Avoid_: snapshot test (for templates), fixture copy assertion

# L0 stays open until exit criteria; ets.jsonc is compacted per stage

The Golden Sample is a living baseline: passing `check` is not L0 completion. L1 (CLI scaffolding) waits on explicit L0 exit criteria (quality debt cleared or ADR-waived, `effect-style` + Dependency Catalog, fingerprint tidy, AGENTS.md↔code match, maintainer sign-off).

`ets.jsonc` is a versioned Fingerprint, not an append-only log. Root keys stay Option Matrix + meta; details nest under `addonOptions`. **Hygiene rhythm:** light tidy whenever an addon is added or `addonOptions` change; a fuller compact at each Capability Tier exit (prune stale options, bump schema `version` with migration notes when shape breaks, keep CLI aware of N/N-1). Generated apps gain `createdAt` / `reproducibleCommand`; the Golden Sample may omit create-time meta.

L0 quality work starts with a review against `repos/effect` / `LLMS.md` / `AGENTS.md`; findings land in `docs/CAPABILITY-TIERS.md` under Golden Sample quality debt until cleared or ADR-waived.

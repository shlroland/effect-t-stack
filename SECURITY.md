# Security Policy

## Supported versions

This repository is the Scaffold Product for `create-effect-t-stack`. Generated apps come from `packages/template-generator`. Security fixes land on `main`.

## Reporting a vulnerability

Please open a private security advisory on GitHub (or email the maintainer listed on the repo) rather than filing a public issue for:

- Remote code execution or dependency supply-chain issues in the CLI / generated apps
- Secrets leakage in templates, examples, or CI

Include reproduction steps, affected commit/tag, and impact. We will acknowledge reports as soon as practical and coordinate disclosure.

## Scope notes

- Do **not** report bugs that only affect vendored `repos/effect` — prefer upstream Effect-TS channels unless the issue is in how this repo vendors or loads it.
- Generated apps inherit user-chosen dependencies after `create`; keep Dependency Catalog pins current via the documented bump loop.

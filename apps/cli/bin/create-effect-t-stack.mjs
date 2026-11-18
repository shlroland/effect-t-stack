#!/usr/bin/env node
/**
 * Stable bin path for npm. Loads the Node ESM bundle produced by `prepack` /
 * `bun run build` (`dist/bin.js`). Works with `npx` and `pnpm dlx` without Bun.
 */
import "../dist/bin.js"

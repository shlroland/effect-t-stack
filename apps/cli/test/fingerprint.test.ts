import { describe, expect, test } from "bun:test"
import { ETS_SCHEMA_URL } from "../src/fingerprint/cliVersion.ts"
import {
  fingerprintJsonSchema,
  parseFingerprint,
  stampCreateFingerprint,
  stripJsoncComments
} from "../src/fingerprint/fingerprint.ts"

describe("fingerprint", () => {
  test("stripJsoncComments keeps URLs and strips line comments", () => {
    const raw = `{
  // note
  "version": 1,
  "url": "https://example.com" // trailing
}`
    const cleaned = stripJsoncComments(raw)
    expect(cleaned).not.toContain("// note")
    expect(cleaned).toContain("https://example.com")
    expect(JSON.parse(cleaned)).toMatchObject({ version: 1 })
  })

  test("parseFingerprint rejects missing stack dims via Schema", () => {
    expect(() => parseFingerprint(`{ "version": 1, "addons": [] }`)).toThrow()
  })

  test("stampCreateFingerprint adds meta + $schema", () => {
    const raw = `{
  "version": 1,
  "name": "effect-t-stack",
  "runtime": "bun",
  "api": "rpc",
  "database": "sqlite",
  "orm": "drizzle",
  "auth": "none",
  "frontend": "tanstack-start",
  "backend": "self",
  "addons": ["turborepo"]
}`
    const stamped = stampCreateFingerprint(raw, {
      scope: "acme",
      packageManager: "bun",
      reproducibleCommand: "create-effect-t-stack create acme --yes",
      cliVersion: "0.1.0",
      manualDb: true
    })
    const fp = parseFingerprint(stamped)
    expect(fp.$schema).toBe(ETS_SCHEMA_URL)
    expect(fp.name).toBe("acme")
    expect(fp.createdAt).toBeDefined()
    expect(fp.cliVersion).toBe("0.1.0")
    expect(fp.reproducibleCommand).toContain("create acme")
    expect(fp.dbSetupOptions?.mode).toBe("manual")
  })

  test("fingerprintJsonSchema emits draft-2020-12 document", () => {
    const schema = fingerprintJsonSchema()
    expect(schema["$id"]).toBe(ETS_SCHEMA_URL)
    expect(schema["$schema"]).toContain("2020-12")
    expect(schema["required"]).toEqual([
      "version",
      "runtime",
      "api",
      "database",
      "orm",
      "auth",
      "frontend",
      "backend",
      "addons"
    ])
  })
})

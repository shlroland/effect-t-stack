import * as Schema from "effect/Schema"

/** Shared Option Matrix literals — single source for Schema, flags, and catalog. */
export const PackageManagerSchema = Schema.Literals(["bun", "npm", "pnpm"])
export type PackageManager = typeof PackageManagerSchema.Type
export const CREATE_PACKAGE_MANAGERS = PackageManagerSchema.literals

export const ApiPrimarySchema = Schema.Literals(["rpc", "httpapi"])
export type ApiPrimary = typeof ApiPrimarySchema.Type
export const CREATE_APIS = ApiPrimarySchema.literals

export const DatabaseSchema = Schema.Literals(["sqlite", "postgres"])
export type Database = typeof DatabaseSchema.Type
export const CREATE_DATABASES = DatabaseSchema.literals

/** MVP auth surface — clerk stays generator-only until a later cell (ADR-0008). */
export const AuthSchema = Schema.Literals(["none", "better-auth"])
export type Auth = typeof AuthSchema.Type
export const CREATE_AUTHS = AuthSchema.literals

export const DirectoryConflictSchema = Schema.Literals([
  "error",
  "overwrite",
  "increment",
  "merge"
])
export type DirectoryConflict = typeof DirectoryConflictSchema.Type
export const CREATE_DIRECTORY_CONFLICTS = DirectoryConflictSchema.literals

export const DbSetupModeSchema = Schema.Literals(["alchemy", "auto", "manual"])
export type DbSetupMode = typeof DbSetupModeSchema.Type

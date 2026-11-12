import { describe, expect, test } from "bun:test"
import { isDeniedName } from "./denylist.ts"
import { toPackageScope } from "./projectName.ts"
import { applyRename, buildRenameMap } from "./rename.ts"

describe("rename", () => {
  test("maps @ets packages to project scope", () => {
    const input = `import { Todo } from "@ets/domain/Todo.ts"\n"@ets/web"\n`
    expect(applyRename(input, "acme")).toBe(
      `import { Todo } from "@acme/domain/Todo.ts"\n"@acme/web"\n`
    )
  })

  test("buildRenameMap lists scope swap", () => {
    expect(buildRenameMap("foo")).toEqual([
      ["@ets/", "@foo/"],
      ["@ets", "@foo"]
    ])
  })

  test("toPackageScope normalizes", () => {
    expect(toPackageScope("My App")).toBe("my-app")
    expect(() => toPackageScope("@@@")).toThrow(/Invalid/)
  })
})

describe("denylist", () => {
  test("denies VCS, deps, repos, env secrets", () => {
    expect(isDeniedName("node_modules")).toBe(true)
    expect(isDeniedName(".git")).toBe(true)
    expect(isDeniedName("repos")).toBe(true)
    expect(isDeniedName(".cursor")).toBe(true)
    expect(isDeniedName(".env")).toBe(true)
    expect(isDeniedName(".env.local")).toBe(true)
    expect(isDeniedName(".env.example")).toBe(false)
    expect(isDeniedName("package.json")).toBe(false)
  })
})

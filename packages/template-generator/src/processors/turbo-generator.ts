import type { VirtualFileSystem } from "../core/virtual-fs.ts"
import { hasAddon } from "../default-config.ts"
import type { ProjectConfig } from "../types.ts"

/** Task-runner JSON is generated, not templated. Shape matches the Golden Sample for the default cell. */
export const processTurboConfig = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  if (!hasAddon(config, "turborepo")) return
  const tasks: Record<string, unknown> = {
    build: {
      dependsOn: ["^build"],
      outputs: ["dist/**"]
    },
    "check-types": {
      dependsOn: ["^check-types"]
    },
    test: {
      dependsOn: ["^check-types"]
    },
    dev: {
      cache: false,
      persistent: true
    }
  }
  if ((config.orm === "drizzle" || config.orm === "prisma") && config.database !== "none") {
    tasks["db:generate"] = { cache: false }
  }
  vfs.writeJson("turbo.json", {
    $schema: "https://turbo.build/schema.json",
    tasks
  })
}

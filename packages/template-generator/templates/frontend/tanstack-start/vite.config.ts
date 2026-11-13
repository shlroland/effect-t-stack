import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/repos/**",
        "**/.git/**",
        "**/dist/**",
        "**/.output/**"
      ]
    }
  },
  resolve: {
    tsconfigPaths: true
  },
  plugins: [
    tanstackStart(),
    // react's vite plugin must come after Start's vite plugin
    viteReact()
  ]
})

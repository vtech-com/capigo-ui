import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The specific entry first: the item's own path in a consumer app, as the demo imports it.
    alias: [
      { find: /^@\/components\/status-split-pill$/, replacement: src("status-split-pill/status-split-pill.tsx") },
      { find: /^@\//, replacement: src("") },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
})

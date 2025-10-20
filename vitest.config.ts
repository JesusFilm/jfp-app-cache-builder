import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["apps/tool/src/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
  },
})
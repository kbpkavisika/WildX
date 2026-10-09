import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "hooks/**/*.ts", "lib/**/*.ts"],
      exclude: ["**/*.d.ts"],
      reporter: ["text", "html", "json-summary", "json"],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});

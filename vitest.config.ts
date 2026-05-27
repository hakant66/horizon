import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    typecheck: { tsconfig: "./tsconfig.test.json" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

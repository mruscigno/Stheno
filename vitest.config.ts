import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["apps/mobile/**", "node_modules/**", ".next/**"],
    coverage: { provider: "v8", reporter: ["text", "json", "html"] },
  },
});

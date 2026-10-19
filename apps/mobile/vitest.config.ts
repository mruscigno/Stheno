import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({ resolve: { alias: { "@assessment": path.resolve(import.meta.dirname, "../../src/modules/assessment"), "@shared": path.resolve(import.meta.dirname, "../../src/platform"), "@": path.resolve(import.meta.dirname, "src") } }, test: { environment: "node", include: ["src/**/*.test.ts"] } });

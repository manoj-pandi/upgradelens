// Settings for Vitest, our test runner (run with `npm test` or `npx vitest run`).
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/" shortcut as tsconfig.json, so tests can write `import { scanFile } from "@/lib/scanner"`.
    alias: { "@": import.meta.dirname },
  },
  test: {
    include: ["tests/**/*.test.ts"], // only files in tests/ that end with .test.ts
  },
});

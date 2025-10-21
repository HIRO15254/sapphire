import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**/*", "node_modules/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "**/*.config.{ts,js}", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // Mock next-auth for tests (not used in todo app)
      { find: /^next-auth$/, replacement: path.resolve(__dirname, "./tests/mocks/next-auth.ts") },
      {
        find: "next-auth/adapters",
        replacement: path.resolve(__dirname, "./tests/mocks/next-auth-adapters.ts"),
      },
      {
        find: "next-auth/providers/discord",
        replacement: path.resolve(__dirname, "./tests/mocks/next-auth-providers-discord.ts"),
      },
    ],
  },
});

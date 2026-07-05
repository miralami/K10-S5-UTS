import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/api",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: process.env.API_BASE_URL || "http://192.168.100.5:8000",
    extraHTTPHeaders: { Accept: "application/json" },
  },
  projects: [
    {
      name: "api",
      testMatch: "**/*.spec.ts",
    },
  ],
});

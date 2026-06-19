/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import { env } from 'process';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  reporter: env.CI
    ? [["junit", { outputFile: "test-results/playwright-junit.xml" }]]
    : [["list"]],
  use: {
    baseURL: 'http://127.0.0.1:5173/qa-dashboard',
    trace: 'on-first-retry',
  },
  webServer: {
    // Start both API and web dev servers so e2e can exercise API endpoints.
    command: env.CI ? 'npm run dev:ci' : 'npm run dev',
    port: 5173,
    reuseExistingServer: !env.CI,
  },
});

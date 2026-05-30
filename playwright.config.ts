import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    browserName: 'firefox',
    headless: true,
    baseURL: 'http://localhost:7777',
  },
  webServer: {
    command: 'node tests/e2e/server.mjs',
    url: 'http://localhost:7777/dist/popup/index.html',
    reuseExistingServer: !process.env.CI,
  },
});

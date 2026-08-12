import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://talia-learn-lms.vercel.app',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

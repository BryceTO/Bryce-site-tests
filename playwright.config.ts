import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL is not set. Run with BASE_URL=https://your-site npm test');
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // Start from a known theme so the dark-mode tests are not affected by the OS setting.
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

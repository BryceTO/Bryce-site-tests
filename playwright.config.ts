import { defineConfig, devices } from '@playwright/test';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL is not set. Run with BASE_URL=https://your-site npm test');
}
// Tests open './' so the page at BASE_URL itself loads, including any subpath
// (e.g. https://user.github.io/repo/). That needs a trailing slash, or './' resolves one level up.
const baseURL = process.env.BASE_URL.endsWith('/') ? process.env.BASE_URL : `${process.env.BASE_URL}/`;

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

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: `output/playwright/run-${process.env.E2E_ITERATION ?? '1'}/test-results`,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: `output/playwright/run-${process.env.E2E_ITERATION ?? '1'}/report`,
      },
    ],
    [
      'json',
      { outputFile: `output/playwright/run-${process.env.E2E_ITERATION ?? '1'}/results.json` },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:59000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
});

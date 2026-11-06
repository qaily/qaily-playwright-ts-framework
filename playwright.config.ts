import { defineConfig, devices } from '@playwright/test';

const port = 3100;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    // Writes each run to reports/data/<run id>/ (JSONL + attachments). `npm run report` turns them into the Qaily report.
    [
      '@qaily/playwright-html-reporter',
      {
        outputDir: 'reports/data',
        // Shown on each run in the report; lanes in the report's settings can match them.
        environment: process.env.CI ? 'ci' : 'local',
        category: 'ui:taskboard',
      },
    ],
  ],
  // Commit, branch and CI link for the report's run list.
  captureGitInfo: { commit: true },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    // A screenshot and a trace for every test, so the report always has images and traces to show.
    screenshot: 'on',
    trace: 'on',
  },
  webServer: {
    command: 'node scripts/serve-demo-app.mjs',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(port) },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

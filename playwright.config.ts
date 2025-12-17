import { defineConfig, devices } from '@playwright/test'

/**
 * Generate test database URL from DATABASE_URL.
 * Appends '_test' suffix to the database name.
 */
function getTestDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    // Return empty string if no DATABASE_URL - will use TEST_DATABASE_URL if set
    return ''
  }

  try {
    const url = new URL(baseUrl)
    const pathParts = url.pathname.split('/')
    const dbName = pathParts[pathParts.length - 1] ?? ''

    if (dbName && !dbName.endsWith('_test')) {
      pathParts[pathParts.length - 1] = `${dbName}_test`
      url.pathname = pathParts.join('/')
    }

    return url.toString()
  } catch {
    return ''
  }
}

// Use TEST_DATABASE_URL if set, otherwise generate from DATABASE_URL
const testDatabaseUrl = process.env.TEST_DATABASE_URL || getTestDatabaseUrl()

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Global setup - clean test database before all tests */
  globalSetup: './tests/e2e/global-setup.ts',

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewports for responsive testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    /* Pass test database URL to the dev server */
    env: {
      DATABASE_URL: testDatabaseUrl || process.env.DATABASE_URL || '',
    },
  },
})

// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/browser',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/playwright-report.json' }],
    ['junit', { outputFile: 'test-results/playwright-results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8081',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording */
    video: 'retain-on-failure',

    /* Locale for testing */
    locale: 'en-US',

    /* Timezone for testing */
    timezoneId: 'Asia/Tashkent', // Uzbekistan timezone
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Harry School specific settings
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        locale: 'en-US',
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        locale: 'en-US',
      },
    },

    /* Test against tablet viewports */
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
        locale: 'en-US',
      },
    },

    /* Multi-language testing */
    {
      name: 'chromium-russian',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ru-RU',
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'chromium-uzbek',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'uz-UZ',
        viewport: { width: 1280, height: 720 },
      },
    },

    /* Accessibility testing */
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Enable accessibility features
        reducedMotion: 'reduce',
        forcedColors: 'active',
      },
    },

    /* Performance testing */
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Throttle network for performance testing
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },

    /* Slow network simulation (Uzbekistan conditions) */
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Simulate slower network conditions
        networkOptions: {
          offline: false,
          downloadThroughput: 1024 * 1024, // 1 Mbps
          uploadThroughput: 512 * 1024,    // 512 Kbps
          latency: 200, // 200ms latency
        }
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/browser/global-setup.js'),
  globalTeardown: require.resolve('./tests/browser/global-teardown.js'),

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'cd apps/student && npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },

  /* Test timeout */
  timeout: 30 * 1000, // 30 seconds

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },

  /* Maximum failures */
  maxFailures: process.env.CI ? 10 : undefined,
});
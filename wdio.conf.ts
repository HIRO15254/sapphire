import type { Options } from '@wdio/types'

export const config: Options.Testrunner = {
  // Test runner services
  runner: 'local',
  
  // Specify Test Files
  specs: ['./test/e2e/**/*.spec.ts'],
  
  // Exclude specific file(s) from test runs
  exclude: [],

  // Capabilities
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      // Run Chrome in headless mode for CI
      args: process.env.CI ? ['--headless', '--disable-gpu'] : [],
    }
  }],

  // WebDriver settings
  port: 9515, // Default port for Tauri's webdriver
  services: [],

  // Test configurations
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // Test framework
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  // Hooks
  before: async () => {
    // Setup before tests
    console.log('Starting E2E tests...')
  },

  after: async () => {
    // Cleanup after tests
    console.log('E2E tests completed.')
  }
}
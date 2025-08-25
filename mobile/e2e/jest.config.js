/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    ['detox/runners/jest/reporter', {
      specs: 'artifacts',
      assignin: 'artifacts'
    }]
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.js'],
  collectCoverageFrom: [
    'apps/**/*.{js,ts,tsx}',
    '!apps/**/*.d.ts',
    '!apps/**/*.stories.{js,ts,tsx}',
    '!apps/**/node_modules/**',
    '!apps/**/ios/**',
    '!apps/**/android/**'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  }
};
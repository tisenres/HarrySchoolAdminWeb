/**
 * Jest Configuration for Harry School Student App
 * 
 * Unit testing configuration for React Native components and services
 */

module.exports = {
  preset: 'react-native',
  
  // Test environment
  testEnvironment: 'node',
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
    '!**/*.e2e.test.(ts|tsx|js)', // Exclude E2E tests
    '!**/*.integration.test.(ts|tsx|js)' // Exclude integration tests
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@harry-school/(.*)$': '<rootDir>/../../../packages/$1/src',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/tests/jest-setup.ts'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.e2e.test.{ts,tsx}',
    '!src/**/*.integration.test.{ts,tsx}',
    '!src/tests/**/*',
    '!src/**/__tests__/**/*',
    '!**/node_modules/**',
  ],
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/hooks/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    }
  },
  
  // Mock modules
  moduleNameMapping: {
    '^react-native$': 'react-native',
    '^@react-navigation/(.*)$': '<rootDir>/src/tests/mocks/react-navigation.ts',
    '^react-native-vector-icons/(.*)$': '<rootDir>/src/tests/mocks/vector-icons.ts',
    '^expo-linking$': '<rootDir>/src/tests/mocks/expo-linking.ts',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/.expo/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context)/)',
  ],
  
  // Clear mocks
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Global variables
  globals: {
    '__DEV__': true,
    '__TEST__': true,
  },
  
  // Report configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'unit-test-results.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ],
};
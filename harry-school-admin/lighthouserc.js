module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard/teachers',
        'http://localhost:3000/dashboard/teachers/create',
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        // Performance assertions
        'categories:performance': ['error', {minScore: 0.8}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.8}],
        'categories:seo': ['error', {minScore: 0.8}],
        
        // Core Web Vitals
        'largest-contentful-paint': ['error', {maxNumericValue: 3000}],
        'first-contentful-paint': ['error', {maxNumericValue: 2000}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}],
        'total-blocking-time': ['error', {maxNumericValue: 500}],
        
        // Teachers Module specific assertions
        'interactive': ['error', {maxNumericValue: 4000}],
        'speed-index': ['error', {maxNumericValue: 3000}],
        
        // Accessibility specific
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'meta-viewport': 'error',
        
        // Best practices
        'uses-https': 'off', // Skip for local testing
        'is-on-https': 'off', // Skip for local testing
        'uses-http2': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        
        // Teachers Module performance
        'unused-javascript': ['warn', {maxLength: 1}],
        'unused-css-rules': ['warn', {maxLength: 1}],
        'modern-image-formats': 'warn',
        'offscreen-images': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
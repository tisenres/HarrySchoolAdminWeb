/**
 * Performance Benchmark Configuration
 * 
 * Configuration file for performance testing and monitoring
 * in Harry School CRM. Defines budgets, thresholds, and test scenarios.
 */

module.exports = {
  // Core Web Vitals budgets (production targets)
  coreWebVitals: {
    // Largest Contentful Paint (LCP) - Time for largest content element to render
    lcp: {
      good: 2500,     // ms - Good performance
      poor: 4000,     // ms - Poor performance threshold
      budget: 2000,   // ms - Our target budget
    },
    
    // First Input Delay (FID) - Time from user interaction to browser response
    fid: {
      good: 100,      // ms - Good performance
      poor: 300,      // ms - Poor performance threshold
      budget: 50,     // ms - Our target budget
    },
    
    // Cumulative Layout Shift (CLS) - Visual stability score
    cls: {
      good: 0.1,      // unitless - Good performance
      poor: 0.25,     // unitless - Poor performance threshold
      budget: 0.05,   // unitless - Our target budget
    },
    
    // First Contentful Paint (FCP) - Time for first content to render
    fcp: {
      good: 1800,     // ms - Good performance
      poor: 3000,     // ms - Poor performance threshold
      budget: 1500,   // ms - Our target budget
    },
    
    // Time to First Byte (TTFB) - Server response time
    ttfb: {
      good: 800,      // ms - Good performance
      poor: 1800,     // ms - Poor performance threshold
      budget: 600,    // ms - Our target budget
    }
  },

  // Component rendering performance budgets
  componentPerformance: {
    // Table components
    studentsTable: {
      render100Records: 100,    // ms - Time to render 100 student records
      render500Records: 300,    // ms - Time to render 500 student records
      virtualScroll1000: 150,   // ms - Virtual scroll with 1000 records
      search: 50,               // ms - Search operation time
      filter: 25,               // ms - Filter operation time
      sort: 75,                 // ms - Sort operation time
    },
    
    groupsTable: {
      render50Records: 75,      // ms - Time to render 50 group records
      render200Records: 200,    // ms - Time to render 200 group records
      virtualScroll500: 120,    // ms - Virtual scroll with 500 records
      search: 40,               // ms - Search operation time
      filter: 20,               // ms - Filter operation time
    },
    
    teachersTable: {
      render25Records: 50,      // ms - Time to render 25 teacher records
      render100Records: 150,    // ms - Time to render 100 teacher records
      search: 30,               // ms - Search operation time
      filter: 15,               // ms - Filter operation time
    },

    // Form components
    forms: {
      studentForm: 100,         // ms - Time to render student form
      groupForm: 80,            // ms - Time to render group form
      teacherForm: 90,          // ms - Time to render teacher form
      formValidation: 10,       // ms - Form validation time
      formSubmission: 200,      // ms - Form submission processing
    },

    // Dashboard components
    dashboard: {
      initialRender: 300,       // ms - Dashboard initial render
      statsCards: 100,         // ms - Stats cards render time
      charts: 200,             // ms - Charts render time
      recentActivity: 150,     // ms - Recent activity list
    }
  },

  // Memory usage budgets (in MB)
  memoryBudgets: {
    initialLoad: 50,           // MB - Initial app load memory
    studentsList: 30,         // MB - Students list with 500 records
    groupsList: 20,           // MB - Groups list with 200 records
    dashboard: 40,            // MB - Dashboard page memory
    forms: 15,                // MB - Form pages memory
    maxMemoryGrowth: 100,     // MB - Maximum allowed memory growth
    gcThreshold: 200,         // MB - Trigger garbage collection
  },

  // Network performance budgets
  networkBudgets: {
    apiResponse: 200,         // ms - API response time
    batchRequests: 500,       // ms - Batch request completion
    imageLoading: 300,        // ms - Image loading time
    chunkLoading: 400,        // ms - JavaScript chunk loading
    cacheHitRatio: 80,        // % - Minimum cache hit ratio
  },

  // Bundle size budgets (in KB)
  bundleBudgets: {
    initialBundle: 500,       // KB - Initial JavaScript bundle
    vendorBundle: 800,        // KB - Vendor libraries bundle
    adminBundle: 300,         // KB - Admin components bundle
    uiBundle: 200,           // KB - UI components bundle
    totalBundle: 1500,       // KB - Total bundle size limit
    
    // Individual component budgets
    studentsModule: 150,     // KB - Students module size
    groupsModule: 120,       // KB - Groups module size
    teachersModule: 100,     // KB - Teachers module size
    performanceModule: 80,   // KB - Performance monitoring module
  },

  // Test scenarios for performance benchmarks
  testScenarios: [
    {
      name: 'Students List - Heavy Load',
      description: 'Test students list performance with large dataset',
      setup: {
        recordCount: 1000,
        includeImages: true,
        enableVirtualScroll: true,
      },
      tests: [
        {
          name: 'Initial Render',
          budget: 200, // ms
          metric: 'renderTime',
        },
        {
          name: 'Search Performance',
          budget: 50, // ms
          metric: 'searchTime',
        },
        {
          name: 'Memory Usage',
          budget: 50, // MB
          metric: 'memoryUsage',
        },
      ],
    },
    
    {
      name: 'Groups Management',
      description: 'Test groups management page performance',
      setup: {
        recordCount: 100,
        includeSchedules: true,
        includeEnrollmentData: true,
      },
      tests: [
        {
          name: 'Page Load',
          budget: 150, // ms
          metric: 'renderTime',
        },
        {
          name: 'Filter Operations',
          budget: 25, // ms
          metric: 'filterTime',
        },
      ],
    },

    {
      name: 'Dashboard Overview',
      description: 'Test dashboard page with full data',
      setup: {
        includeCharts: true,
        includeStats: true,
        includeRecentActivity: true,
      },
      tests: [
        {
          name: 'Dashboard Load',
          budget: 300, // ms
          metric: 'renderTime',
        },
        {
          name: 'Interactive Elements',
          budget: 100, // ms
          metric: 'interactionTime',
        },
      ],
    },
  ],

  // Lighthouse configuration for CI/CD
  lighthouse: {
    ci: {
      collect: {
        numberOfRuns: 3,
        settings: {
          chromeFlags: [
            '--headless',
            '--no-sandbox',
            '--disable-gpu',
          ],
        },
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['error', { minScore: 0.9 }],
          'categories:seo': ['error', { minScore: 0.8 }],
        },
      },
      upload: {
        target: 'temporary-public-storage',
      },
    },
  },

  // Performance monitoring configuration
  monitoring: {
    // How often to collect performance metrics (ms)
    collectInterval: 5000,
    
    // Memory monitoring settings
    memory: {
      enabled: true,
      gcThreshold: 0.8, // Trigger GC at 80% memory usage
      leakDetectionSamples: 20,
    },
    
    // Core Web Vitals tracking
    webVitals: {
      enabled: true,
      reportThreshold: {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
      },
    },
    
    // Custom metrics tracking
    customMetrics: {
      trackComponentRenders: true,
      trackApiRequests: true,
      trackImageLoading: true,
      trackMemoryUsage: true,
    },
  },

  // Environment-specific configurations
  environments: {
    development: {
      enableProfiling: true,
      verboseLogging: true,
      showPerformanceOverlay: true,
      memorySampling: true,
    },
    
    staging: {
      enableProfiling: false,
      verboseLogging: false,
      runLighthouse: true,
      performanceReporting: true,
    },
    
    production: {
      enableProfiling: false,
      verboseLogging: false,
      webVitalsReporting: true,
      errorTracking: true,
      performanceAlerting: true,
    },
  },

  // Performance optimization settings
  optimizations: {
    // Image optimization
    images: {
      formats: ['avif', 'webp', 'jpg'],
      quality: 85,
      lazyLoading: true,
      placeholder: 'blur',
    },
    
    // Code splitting
    codeSplitting: {
      enabled: true,
      strategy: 'route-based',
      chunkSize: 250, // KB
      preloadCritical: true,
    },
    
    // Caching strategies
    caching: {
      apiRequests: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 100, // entries
      },
      components: {
        memoization: true,
        virtualScrolling: true,
      },
    },
  },

  // Alerting thresholds
  alerts: {
    performance: {
      lcpThreshold: 3000,     // Alert if LCP > 3s
      fidThreshold: 150,      // Alert if FID > 150ms
      clsThreshold: 0.15,     // Alert if CLS > 0.15
    },
    
    memory: {
      usageThreshold: 150,    // Alert if memory usage > 150MB
      leakDetection: true,    // Alert on memory leaks
      growthRate: 20,        // Alert if growth > 20% per minute
    },
    
    bundle: {
      sizeThreshold: 2000,   // Alert if bundle > 2MB
      chunkThreshold: 500,   // Alert if chunk > 500KB
    },
  },
};
/**
 * Harry School Mobile Design System - Performance Optimization
 * 
 * Performance guidelines and optimizations for mobile educational apps
 * Target metrics: <2s app launch, <300ms transitions, <1s data loading
 */

import { animation, performance } from './tokens';

// Performance Targets (Based on UX Research)
export const performanceTargets = {
  // App launch performance
  launch: {
    coldStart: 2000,          // <2s cold start (iOS/Android)
    warmStart: 1000,          // <1s warm start
    interactive: 1500,        // <1.5s to interactive
    firstContentfulPaint: 800, // <800ms first content
  },
  
  // UI transition performance
  transitions: {
    screenTransition: 300,    // <300ms screen transitions
    modalAnimation: 250,      // <250ms modal animations
    buttonPress: 100,         // <100ms button feedback
    scrolling: 16,            // 60fps scrolling (16ms per frame)
  },
  
  // Data loading performance
  dataLoading: {
    cachedContent: 1000,      // <1s for cached content
    networkRequest: 3000,     // <3s for network requests
    imageLoading: 2000,       // <2s for images
    audioLoading: 1500,       // <1.5s for audio files
  },
  
  // Memory usage targets
  memory: {
    maxHeapSize: 100,         // <100MB heap size
    maxImageCache: 50,        // <50MB image cache
    maxAudioCache: 20,        // <20MB audio cache
    gcFrequency: 30000,       // 30s between GC cycles
  },
  
  // Battery optimization
  battery: {
    maxCpuUsage: 30,          // <30% average CPU usage
    backgroundActivity: 5,     // <5% when backgrounded
    animationFps: 60,         // 60fps for smooth animations
    networkEfficiency: 0.9,   // 90% network efficiency
  },
};

// Animation Performance
export const animationPerformance = {
  // Optimized animation properties (avoid expensive repaints)
  performantProperties: [
    'transform',              // GPU accelerated
    'opacity',                // GPU accelerated
    'scale',                  // GPU accelerated (part of transform)
    'translateX',             // GPU accelerated (part of transform)
    'translateY',             // GPU accelerated (part of transform)
    'rotate',                 // GPU accelerated (part of transform)
  ],
  
  // Properties to avoid (cause layout/repaint)
  expensiveProperties: [
    'width',                  // Causes layout
    'height',                 // Causes layout
    'top',                    // Causes layout
    'left',                   // Causes layout
    'margin',                 // Causes layout
    'padding',                // Causes layout
    'borderWidth',            // Causes layout
  ],
  
  // Animation configurations for different contexts
  configurations: {
    // Teacher app - efficiency focused
    teacher: {
      duration: animation.duration.fast,     // Quick animations
      easing: animation.easing.easeOut,       // Natural feel
      useNativeDriver: true,                  // GPU acceleration
      enableVelocityTracking: false,         // Disable for simplicity
    },
    
    // Student app - engagement focused
    student: {
      duration: animation.duration.normal,   // Standard animations
      easing: animation.easing.easeInOut,     // Playful feel
      useNativeDriver: true,                  // GPU acceleration
      enableVelocityTracking: true,          // Enable for gamification
    },
    
    // Reduced motion accessibility
    reducedMotion: {
      duration: 0,                           // No animations
      easing: 'linear',                      // Instant
      useNativeDriver: true,                 // Still use GPU
      respectSystemSetting: true,            // Honor user preference
    },
  },
  
  // Performance monitoring for animations
  monitoring: {
    trackFrameRate: true,     // Monitor FPS during animations
    logSlowAnimations: true,  // Log animations >16ms per frame
    profileMemoryUsage: true, // Track memory during animations
  },
};

// Image Optimization
export const imageOptimization = {
  // Image loading strategies
  loading: {
    lazy: true,               // Lazy load off-screen images
    progressive: true,        // Progressive JPEG loading
    placeholder: true,        // Show placeholder while loading
    priority: 'vocabulary',   // Prioritize vocabulary images
  },
  
  // Image caching
  caching: {
    maxCacheSize: 50 * 1024 * 1024,  // 50MB cache limit
    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    preloadCritical: true,            // Preload critical images
    compressionLevel: 0.8,            // 80% quality for mobile
  },
  
  // Image formats and sizes
  formats: {
    preferred: ['webp', 'jpg', 'png'], // Order of preference
    avatarSize: { width: 100, height: 100 },
    vocabularyImage: { width: 300, height: 200 },
    achievementBadge: { width: 80, height: 80 },
    backgroundImage: { width: 375, height: 667 }, // iPhone SE base
  },
  
  // Responsive image loading
  responsive: {
    breakpoints: [375, 414, 768],     // Mobile breakpoints
    densities: [1, 2, 3],             // 1x, 2x, 3x density
    format: 'webp',                   // Modern format preference
  },
};

// Bundle Optimization
export const bundleOptimization = {
  // Code splitting strategies
  codeSplitting: {
    routeBased: true,         // Split by screens/routes
    componentBased: false,    // Don't over-split components
    vendorSeparation: true,   // Separate vendor bundles
    asyncImports: true,       // Use dynamic imports
  },
  
  // Bundle size targets
  sizeTargets: {
    initialBundle: 500 * 1024,        // <500KB initial
    routeChunks: 200 * 1024,          // <200KB per route
    componentChunks: 50 * 1024,       // <50KB per component
    totalBudget: 2 * 1024 * 1024,     // <2MB total
  },
  
  // Tree shaking optimization
  treeShaking: {
    enabled: true,            // Remove unused code
    sideEffects: false,       // Mark as side-effect free
    preserveModules: false,   // Allow aggressive optimization
  },
  
  // Module resolution optimization
  moduleResolution: {
    preferESModules: true,    // Use ES modules when available
    aliasResolution: true,    // Use module aliases
    cacheModules: true,       // Cache resolved modules
  },
};

// Memory Management
export const memoryManagement = {
  // Garbage collection optimization
  garbageCollection: {
    aggressive: false,        // Don't force GC too often
    pooling: true,           // Use object pooling
    weakReferences: true,    // Use weak refs where appropriate
  },
  
  // Memory leak prevention
  leakPrevention: {
    eventListenerCleanup: true,      // Clean up event listeners
    timerCleanup: true,              // Clear timers/intervals
    subscriptionCleanup: true,       // Clean up subscriptions
    componentCleanup: true,          // Clean up component state
  },
  
  // Memory monitoring
  monitoring: {
    trackHeapSize: true,      // Monitor heap usage
    trackImageMemory: true,   // Monitor image memory
    trackComponentMemory: true, // Track component memory
    alertThreshold: 0.8,      // Alert at 80% memory usage
  },
  
  // Memory optimization strategies
  strategies: {
    // Educational content caching
    vocabularyCache: {
      maxSize: 100,           // Cache 100 vocabulary items
      evictionPolicy: 'LRU',  // Least Recently Used
      compression: true,      // Compress cached data
    },
    
    // Audio content management
    audioCache: {
      maxSize: 20 * 1024 * 1024,  // 20MB audio cache
      preloadNext: 3,             // Preload next 3 audio files
      compression: 'opus',        // Use Opus compression
    },
    
    // Image memory management
    imageMemory: {
      maxConcurrent: 10,      // Max 10 images in memory
      downscaling: true,      // Downscale for screen size
      recycling: true,        // Recycle image views
    },
  },
};

// Network Optimization
export const networkOptimization = {
  // Request optimization
  requests: {
    batching: true,           // Batch multiple requests
    compression: 'gzip',      // Use gzip compression
    keepAlive: true,          // Keep connections alive
    timeout: 10000,           // 10s request timeout
  },
  
  // Caching strategies
  caching: {
    strategy: 'stale-while-revalidate', // Show cached, fetch in background
    maxAge: 300000,           // 5 minutes default cache
    etags: true,              // Use ETags for validation
    offline: true,            // Enable offline caching
  },
  
  // Offline optimization
  offline: {
    criticalResources: [
      'vocabulary-basic',     // Basic vocabulary
      'lessons-current',      // Current lessons
      'user-progress',        // User progress data
    ],
    storageQuota: 100 * 1024 * 1024, // 100MB offline storage
    syncStrategy: 'background',       // Background sync
  },
  
  // Data optimization
  dataOptimization: {
    pagination: true,         // Paginate large datasets
    compression: true,        // Compress API responses
    minification: true,       // Minify JSON responses
    deltaSync: true,          // Only sync changes
  },
};

// Performance Monitoring
export const performanceMonitoring = {
  // Metrics to track
  metrics: {
    // Core Web Vitals adapted for mobile
    appLaunchTime: true,      // Time to interactive
    screenTransitionTime: true, // Navigation performance
    inputDelay: true,         // Touch input responsiveness
    visualStability: true,    // Layout shift prevention
    
    // Custom educational metrics
    lessonLoadTime: true,     // Lesson content loading
    vocabularyLoadTime: true, // Vocabulary card loading
    audioPlaybackDelay: true, // Audio pronunciation delay
    progressSyncTime: true,   // Progress sync performance
  },
  
  // Performance budgets
  budgets: {
    // Time budgets
    launchTimeBudget: performanceTargets.launch.coldStart,
    transitionBudget: performanceTargets.transitions.screenTransition,
    loadingBudget: performanceTargets.dataLoading.cachedContent,
    
    // Resource budgets
    memoryBudget: performanceTargets.memory.maxHeapSize,
    bundleBudget: bundleOptimization.sizeTargets.totalBudget,
    imageBudget: imageOptimization.caching.maxCacheSize,
  },
  
  // Alerting thresholds
  alerting: {
    slowLaunch: 3000,         // Alert if launch >3s
    slowTransition: 500,      // Alert if transition >500ms
    highMemory: 80 * 1024 * 1024, // Alert if memory >80MB
    lowFps: 45,               // Alert if FPS <45
  },
};

// Platform-Specific Optimizations
export const platformOptimizations = {
  // iOS specific optimizations
  ios: {
    // Metal rendering optimizations
    metal: {
      useMetalRenderer: true,   // Use Metal for graphics
      shaderCaching: true,      // Cache compiled shaders
      bufferPooling: true,      // Pool vertex buffers
    },
    
    // Core Animation optimizations
    coreAnimation: {
      useCADisplayLink: true,   // Sync with display refresh
      enableRasterization: false, // Avoid unless necessary
      optimizeLayerTree: true,  // Flatten layer hierarchy
    },
    
    // Memory optimizations
    memory: {
      useMemoryPools: true,     // Pool memory allocations
      enableJetsamProtection: true, // Protect from memory kills
      optimizeImageDecoding: true,  // Efficient image decoding
    },
  },
  
  // Android specific optimizations
  android: {
    // Rendering optimizations
    rendering: {
      useSkiaRenderer: true,    // Use Skia for graphics
      enableHardwareAcceleration: true, // GPU acceleration
      optimizeViewHierarchy: true, // Flatten view tree
    },
    
    // Dalvik/ART optimizations
    runtime: {
      enableAot: true,          // Ahead-of-time compilation
      optimizeDex: true,        // Optimize DEX files
      useProguard: true,        // Code obfuscation/optimization
    },
    
    // Battery optimizations
    battery: {
      useJobScheduler: true,    // Efficient background tasks
      optimizeWakelocks: true,  // Minimize wake locks
      enableDozeMode: true,     // Support Doze mode
    },
  },
};

// Development vs Production Optimizations
export const environmentOptimizations = {
  // Development optimizations (faster iteration)
  development: {
    bundling: {
      sourceMaps: true,         // Full source maps
      hotReload: true,          // Fast refresh
      minification: false,      // Skip minification
    },
    monitoring: {
      performanceWarnings: true, // Show perf warnings
      memoryAlerts: true,       // Show memory alerts
      bundleAnalysis: true,     // Analyze bundle size
    },
  },
  
  // Production optimizations (best performance)
  production: {
    bundling: {
      sourceMaps: false,        // No source maps
      minification: true,       // Aggressive minification
      compression: true,        // Gzip/Brotli compression
      treeshaking: true,        // Remove dead code
    },
    monitoring: {
      errorReporting: true,     // Error tracking
      performanceTracking: true, // Performance metrics
      crashReporting: true,     // Crash analytics
    },
  },
};

// Performance Testing
export const performanceTesting = {
  // Automated performance tests
  automated: {
    loadTesting: true,        // Test with large datasets
    stressTesting: true,      // Test under stress
    memorylLeakTesting: true, // Test for memory leaks
    batteryTesting: false,    // Battery testing (manual)
  },
  
  // Performance benchmarks
  benchmarks: {
    syntheticBenchmarks: true, // Synthetic performance tests
    realWorldScenarios: true, // Real user scenarios
    deviceVariations: true,   // Test across device types
    networkVariations: true,  // Test different network speeds
  },
  
  // Performance regression testing
  regression: {
    continuousMonitoring: true, // Monitor in CI/CD
    performanceBudgets: true,   // Enforce budgets
    trendAnalysis: true,        // Track performance trends
  },
};

// Utility Functions
export const performanceUtils = {
  // Measure performance of async operations
  measureAsync: async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },
  
  // Debounce function for performance optimization
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // Throttle function for performance optimization
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Memory usage checker
  checkMemoryUsage: () => {
    // Platform-specific memory checking would go here
    if (__DEV__) {
      console.log('[Performance] Memory check requested');
    }
  },
  
  // FPS counter utility
  createFpsCounter: () => {
    let frames = 0;
    let lastTime = performance.now();
    
    return {
      tick: () => {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          const fps = Math.round(frames * 1000 / (now - lastTime));
          if (__DEV__) {
            console.log(`[Performance] FPS: ${fps}`);
          }
          frames = 0;
          lastTime = now;
          return fps;
        }
        return null;
      }
    };
  },
};

// Export all performance specifications
export default {
  targets: performanceTargets,
  animation: animationPerformance,
  image: imageOptimization,
  bundle: bundleOptimization,
  memory: memoryManagement,
  network: networkOptimization,
  monitoring: performanceMonitoring,
  platform: platformOptimizations,
  environment: environmentOptimizations,
  testing: performanceTesting,
  utils: performanceUtils,
};
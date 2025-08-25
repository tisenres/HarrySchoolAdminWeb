const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle optimization configuration
config.resolver.platforms = ['ios', 'android', 'web'];

// Enable tree shaking and dead code elimination
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Terser configuration for better tree shaking
    ecma: 2015,
    module: true,
    toplevel: true,
    compress: {
      drop_console: true, // Remove console logs in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.warn'], // Mark as pure functions
      passes: 2, // Multiple passes for better optimization
    },
    mangle: {
      toplevel: true,
      eval: true,
      keep_fnames: false,
    },
    format: {
      comments: false,
    },
  },
  // Enable experimental import/export support
  experimentalImportSupport: true,
  // Inline requires for better bundling
  inlineRequires: true,
};

// Optimize bundle splitting
config.serializer = {
  ...config.serializer,
  // Enable bundle splitting
  createModuleIdFactory: () => (path) => {
    // Create stable module IDs for better caching
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(path).digest('hex').substr(0, 8);
  },
  // Customize chunk splitting
  processModuleFilter: (module) => {
    // Filter out dev-only modules in production
    if (module.path.includes('__DEV__') && process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  },
};

// Resolver configuration for better tree shaking
config.resolver = {
  ...config.resolver,
  // Enable tree shaking for these packages
  resolverMainFields: ['react-native', 'browser', 'module', 'main'],
  // Alias configuration for bundle optimization
  alias: {
    // Ensure we use the same React instance
    'react': require.resolve('react'),
    'react-native': require.resolve('react-native'),
    // Optimize Reanimated imports
    'react-native-reanimated': require.resolve('react-native-reanimated'),
    // MMKV optimization
    'react-native-mmkv': require.resolve('react-native-mmkv'),
  },
  // Source extensions for better resolution
  sourceExts: [...config.resolver.sourceExts, 'ts', 'tsx', 'jsx', 'js', 'json'],
  // Asset extensions
  assetExts: [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'],
};

// Cache configuration for faster builds
config.cacheStores = [
  {
    name: 'filesystem',
    options: {
      cacheDirectory: require('path').join(__dirname, 'node_modules/.cache/metro'),
    },
  },
];

// Watch configuration
config.watchFolders = [
  require('path').resolve(__dirname, 'packages'),
];

// Bundle size optimization based on platform
if (process.env.PLATFORM) {
  // Platform-specific optimizations
  const platform = process.env.PLATFORM;
  
  if (platform === 'ios') {
    // iOS-specific optimizations
    config.transformer.experimentalImportSupport = true;
  } else if (platform === 'android') {
    // Android-specific optimizations
    config.transformer.enableBabelRuntime = false; // Reduce bundle size
  }
}

// Development vs Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    compress: {
      ...config.transformer.minifierConfig.compress,
      // More aggressive compression in production
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
      keep_infinity: false,
      loops: true,
      unused: true,
    },
  };
} else {
  // Development optimizations for faster builds
  config.transformer.minifierPath = undefined; // Disable minification
  config.serializer.getRunModuleStatement = (moduleId) => 
    `__r(${JSON.stringify(moduleId)});`; // Faster runtime
}

// Cultural optimization - prayer time aware builds
const isPrayerTime = () => {
  const hour = new Date().getHours();
  return [5, 12, 15, 18, 20].includes(hour);
};

if (isPrayerTime()) {
  // Reduce build intensity during prayer times
  config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2));
  config.transformer.minifierConfig.compress.passes = 1; // Single pass
}

// Educational context optimization
const USER_TYPE = process.env.USER_TYPE || 'student';

// Bundle splitting strategy based on user type
const getBundleSplittingStrategy = (userType) => {
  const strategies = {
    student: {
      // Student app priorities
      criticalChunks: ['Dashboard', 'Lessons', 'Vocabulary'],
      lazyChunks: ['Profile', 'Settings', 'Feedback'],
      chunkSizeThreshold: 100, // KB
    },
    teacher: {
      // Teacher app priorities
      criticalChunks: ['TeacherDashboard', 'Attendance', 'Students'],
      lazyChunks: ['Reports', 'Settings', 'Profile'],
      chunkSizeThreshold: 120, // KB - teachers have more complex UIs
    },
    admin: {
      // Admin priorities (not mobile, but for completeness)
      criticalChunks: ['AdminDashboard', 'Users', 'Settings'],
      lazyChunks: ['Reports', 'Analytics', 'Logs'],
      chunkSizeThreshold: 150, // KB
    },
  };
  
  return strategies[userType] || strategies.student;
};

const splittingStrategy = getBundleSplittingStrategy(USER_TYPE);

// Apply splitting strategy
config.serializer.experimentalSerializerHook = (graph, delta) => {
  // Custom serialization logic for bundle splitting would go here
  // This is a placeholder for the actual implementation
  return delta;
};

// Export standard Metro configuration
module.exports = config;
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    // Enable tree shaking
    mode: env.mode || 'development',
  }, argv);

  // Bundle optimization configuration
  const isProduction = env.mode === 'production';
  const userType = process.env.USER_TYPE || 'student';
  
  // Prayer time check for cultural optimization
  const isPrayerTime = () => {
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  };

  // Advanced code splitting
  config.optimization = {
    ...config.optimization,
    // Enable module concatenation for better tree shaking
    concatenateModules: isProduction,
    // Split chunks configuration
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk for third-party libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
          reuseExistingChunk: true,
        },
        // React and React Native specific chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-native-web)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
          reuseExistingChunk: true,
        },
        // Animation libraries chunk
        animations: {
          test: /[\\/]node_modules[\\/](react-native-reanimated|lottie-react-native|react-native-svg)[\\/]/,
          name: 'animations',
          chunks: 'async',
          priority: 25,
          reuseExistingChunk: true,
        },
        // UI library chunk
        ui: {
          test: /[\\/]node_modules[\\/](@shopify\/flash-list|react-native-mmkv)[\\/]/,
          name: 'ui',
          chunks: 'async',
          priority: 15,
          reuseExistingChunk: true,
        },
        // Educational context specific chunks
        student: {
          test: /[\\/](student|lesson|vocabulary)[\\/]/i,
          name: 'student-features',
          chunks: 'async',
          priority: 10,
          reuseExistingChunk: true,
          enforce: userType === 'student',
        },
        teacher: {
          test: /[\\/](teacher|attendance|evaluation)[\\/]/i,
          name: 'teacher-features',
          chunks: 'async',
          priority: 10,
          reuseExistingChunk: true,
          enforce: userType === 'teacher',
        },
        // Common chunk for shared components
        common: {
          test: /[\\/](shared|common|utils)[\\/]/,
          name: 'common',
          chunks: 'all',
          priority: 5,
          minChunks: 2,
          reuseExistingChunk: true,
        },
        // Default chunk
        default: {
          minChunks: 2,
          priority: -10,
          reuseExistingChunk: true,
        },
      },
      // Optimize chunk sizes
      maxAsyncRequests: isProduction ? 6 : 30,
      maxInitialRequests: isProduction ? 4 : 30,
      minSize: 20000, // 20KB minimum chunk size
      maxSize: isProduction ? 200000 : 0, // 200KB maximum chunk size in production
    },
    // Tree shaking configuration
    usedExports: true,
    sideEffects: false,
    // Module IDs optimization
    moduleIds: isProduction ? 'deterministic' : 'named',
    chunkIds: isProduction ? 'deterministic' : 'named',
  };

  // Advanced tree shaking and dead code elimination
  if (isProduction) {
    config.optimization.minimizer = [
      ...config.optimization.minimizer,
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          compress: {
            // Aggressive dead code elimination
            dead_code: true,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.warn', 'console.info'],
            passes: isPrayerTime() ? 1 : 2, // Reduce compilation intensity during prayer
            // Remove unused code
            unused: true,
            // Optimize loops
            loops: true,
            // Remove unreachable code
            conditionals: true,
            // Inline functions
            inline: 2,
          },
          mangle: {
            // Mangle all names except React-related ones
            reserved: ['React', 'ReactDOM', 'useState', 'useEffect'],
            toplevel: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ];
  }

  // Resolve configuration for better tree shaking
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      // Optimize React Native Web imports
      'react-native$': 'react-native-web',
      // Educational context aliases
      '@student': path.resolve(__dirname, 'src/features/student'),
      '@teacher': path.resolve(__dirname, 'src/features/teacher'),
      '@shared': path.resolve(__dirname, 'packages/shared'),
      '@components': path.resolve(__dirname, 'packages/shared/components'),
      '@utils': path.resolve(__dirname, 'packages/shared/utils'),
      '@hooks': path.resolve(__dirname, 'packages/shared/hooks'),
      '@api': path.resolve(__dirname, 'packages/shared/api'),
      // Performance optimizations
      'react-native-reanimated$': 'react-native-reanimated/lib/reanimated2/index.web.js',
      'react-native-mmkv$': 'react-native-mmkv/lib/index.web.js',
    },
    // Module resolution optimization
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.json'],
  };

  // Module rules for tree shaking
  config.module.rules.push(
    {
      test: /\.(js|ts|tsx)$/,
      include: path.resolve(__dirname, 'packages/shared'),
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              modules: false, // Preserve ES modules for tree shaking
              useBuiltIns: 'entry',
              corejs: 3,
            }],
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
          plugins: [
            // Enable tree shaking for these libraries
            ['import', {
              libraryName: 'lodash',
              libraryDirectory: '',
              camel2DashComponentName: false,
            }, 'lodash'],
            // React Native Web optimizations
            'react-native-web/babel',
            // Dead code elimination
            ['babel-plugin-transform-remove-console', {
              exclude: ['error', 'warn'],
            }],
          ],
        },
      },
    }
  );

  // Performance budgets and monitoring
  config.performance = {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 400000, // 400KB
    maxAssetSize: 250000, // 250KB
  };

  // Bundle analyzer for development
  if (process.env.ANALYZE_BUNDLE === 'true') {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
        reportFilename: `bundle-analysis-${userType}.html`,
      })
    );
  }

  // Educational context specific optimizations
  const educationalOptimizations = {
    student: {
      // Student-specific optimizations
      excludeChunks: ['teacher-features', 'admin-features'],
      prioritizeChunks: ['student-features', 'lessons', 'vocabulary'],
    },
    teacher: {
      // Teacher-specific optimizations
      excludeChunks: ['student-features', 'admin-features'],
      prioritizeChunks: ['teacher-features', 'attendance', 'evaluation'],
    },
  };

  const currentOptimizations = educationalOptimizations[userType];
  if (currentOptimizations && isProduction) {
    // Apply user-type specific optimizations
    config.plugins.push(
      new (require('webpack').IgnorePlugin)({
        resourceRegExp: new RegExp(currentOptimizations.excludeChunks.join('|')),
      })
    );
  }

  // Cultural optimization - prayer time aware builds
  if (isPrayerTime()) {
    // Reduce build intensity during prayer times
    config.parallelism = 1;
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      // Increased cache during prayer time for faster builds
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  // Progressive Web App optimizations
  if (isProduction) {
    const WorkboxPlugin = require('workbox-webpack-plugin');
    config.plugins.push(
      new WorkboxPlugin.GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        // Cache strategies for educational content
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\..*\.(json)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      })
    );
  }

  // Source map optimization
  if (isProduction) {
    config.devtool = 'source-map'; // Separate source maps for production
  } else {
    config.devtool = 'eval-cheap-module-source-map'; // Fast rebuilds in development
  }

  return config;
};
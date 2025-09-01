import type { NextConfig } from "next";
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Development origins (only in development)
  ...(isDev && {
    allowedDevOrigins: [
      '3b1348a71f69.ngrok-free.app',
      '*.ngrok-free.app',
    ],
  }),
  
  // Type checking and linting configuration  
  typescript: {
    ignoreBuildErrors: false, // Enable type checking in production
  },
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint in production builds
  },
  
  // Enable standalone output for production deployment
  output: 'standalone',
  trailingSlash: false,
  
  // Performance Optimizations
  compress: true,
  

  // Force all pages to be dynamic to avoid static generation issues
  generateBuildId: () => 'build',
  
  // Experimental features for performance
  experimental: {
    // Optimize for development vs production
    ...(isDev ? {
      // Development optimizations
      optimizeCss: false, // Skip CSS optimization in dev
      optimizeServerReact: false, // Skip server optimization in dev
    } : {
      // Production optimizations
      optimizeCss: true,
      optimizeServerReact: true,
      webpackBuildWorker: true,
      esmExternals: true,
      // Memory optimization (Next.js 15+)
      webpackMemoryOptimizations: true,
      // CSS chunking for better caching
      cssChunking: 'strict',
    }),
    
    // Optimize worker configuration
    ...(process.env['DISABLE_STATIC_GENERATION'] === 'true' && {
      workerThreads: false,
      cpus: 1,
    }),
    
    // Enable concurrent features for performance
    ppr: false, // Partial Prerendering can cause slower initial loads in dev
    
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      'date-fns',                    // Optimize date imports (major savings)
      'lucide-react',               // Icon tree-shaking
      'recharts',                   // Chart library optimization
      '@radix-ui/react-icons',      // Icon optimization
      '@tanstack/react-query',      // Query optimization
      'framer-motion',              // Animation tree-shaking
      'react-hook-form',            // Form optimization
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'axios',                      // HTTP client optimization
      'clsx',                       // Class utility optimization
      'tailwind-merge',             // Tailwind optimization
    ],
    
    // Server Components HMR cache for faster dev
    serverComponentsHmrCache: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for security and performance
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()'
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'wasm-unsafe-eval' https://vercel.live",
          "style-src 'self' https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://vitals.vercel-insights.com",
          "frame-ancestors 'none'",
          "frame-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
          "media-src 'self'",
          "worker-src 'self'",
          "manifest-src 'self'",
          "upgrade-insecure-requests",
          "block-all-mixed-content"
        ].join('; ')
      }
    ]
    
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      },
      // Cache static assets aggressively
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Development optimizations for faster builds
    if (dev) {
      // Enable persistent filesystem caching for development
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve('.next/cache/webpack'),
        buildDependencies: {
          config: [__filename, path.resolve('package.json')],
        },
        // Cache for 24 hours in development
        maxAge: 1000 * 60 * 60 * 24,
        maxMemoryGenerations: 1,
        allowCollectingMemory: true,
        compression: false, // Disable compression for faster writes in dev
      };

      // Use Next.js default devtool in development
      // config.devtool = 'eval-cheap-module-source-map'; // Let Next.js handle this

      // Reduce bundle size checks in development
      config.performance = {
        hints: false
      };

      // Enable webpack 5 snapshot optimizations
      config.snapshot = {
        managedPaths: [path.resolve('node_modules')],
        immutablePaths: [],
        buildDependencies: {
          hash: true,
          timestamp: true,
        },
        module: {
          timestamp: true,
          hash: true,
        },
        resolve: {
          timestamp: true,
          hash: true,
        },
      };
    }
    
    // Performance optimizations for production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Create a separate chunk for React and ReactDOM
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // UI components chunk
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              priority: 30,
              minChunks: 2,
            },
            // Admin components chunk
            admin: {
              name: 'admin',
              chunks: 'all',
              test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
              priority: 25,
              minChunks: 1,
            },
            // Common libraries chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            // Common utilities chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              priority: 10,
            },
          },
        },
      }
    }

    // Add bundle analyzer
    if (process.env['ANALYZE'] === 'true') {
      const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: true,
        openAnalyzer: true,
      })
      return withBundleAnalyzer({}).webpack(config, { dev, isServer })
    }

    return config
  },

  // Performance monitoring
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Logging configuration for better debugging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);

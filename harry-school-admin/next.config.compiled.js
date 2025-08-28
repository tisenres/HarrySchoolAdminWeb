// This is a compiled version of next.config.ts for webpack cache compatibility
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  allowedDevOrigins: [
    '3b1348a71f69.ngrok-free.app',
    '*.ngrok-free.app',
  ],
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  output: 'standalone',
  trailingSlash: false,
  compress: true,

  experimental: {
    ...(isDev ? {
      optimizeCss: false,
      optimizeServerReact: false,
    } : {
      optimizeCss: true,
      optimizeServerReact: true,
      webpackBuildWorker: true,
      esmExternals: true,
      webpackMemoryOptimizations: true,
      cssChunking: 'strict',
    }),
    
    ppr: false,
    
    optimizePackageImports: [
      'date-fns',
      'lucide-react',
      'recharts',
      '@radix-ui/react-icons',
      '@tanstack/react-query',
      'framer-motion',
      'react-hook-form',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'axios',
      'clsx',
      'tailwind-merge',
    ],
    
    serverComponentsHmrCache: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
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

  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve('.next/cache/webpack'),
        buildDependencies: {
          config: [__filename, path.resolve('package.json')],
        },
        maxAge: 1000 * 60 * 60 * 24,
        maxMemoryGenerations: 1,
        allowCollectingMemory: true,
        compression: false,
      };

      config.performance = {
        hints: false
      };

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
    
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 40,
              enforce: true,
            },
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              priority: 30,
              minChunks: 2,
            },
            admin: {
              name: 'admin',
              chunks: 'all',
              test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
              priority: 25,
              minChunks: 1,
            },
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
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

    if (process.env['ANALYZE'] === 'true') {
      const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: true,
        openAnalyzer: true,
      })
      return withBundleAnalyzer({}).webpack(config, { dev, isServer })
    }

    return config
  },

  poweredByHeader: false,
  reactStrictMode: true,
  
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
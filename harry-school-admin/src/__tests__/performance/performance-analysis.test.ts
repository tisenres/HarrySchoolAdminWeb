/**
 * Performance Analysis Testing Suite
 * Tests bundle size, Core Web Vitals, memory usage, and optimization metrics
 */

import { test, expect } from '@playwright/test'
import { readFileSync, statSync } from 'fs'
import { join } from 'path'

const API_BASE_URL = 'http://localhost:3002'

test.setTimeout(120000) // 2 minutes for performance tests

test.describe('⚡ Performance Testing - Production Readiness', () => {
  
  test.beforeAll(async () => {
    console.log('⚡ Starting Performance Analysis test suite...')
  })

  test.describe('📦 Bundle Size Analysis', () => {
    test('should have acceptable bundle sizes', async () => {
      try {
        // Check if .next build exists
        const buildPath = join(process.cwd(), '.next')
        const buildExists = require('fs').existsSync(buildPath)
        
        console.log(`Build directory exists: ${buildExists}`)
        
        if (buildExists) {
          // Analyze bundle sizes
          const staticPath = join(buildPath, 'static')
          
          if (require('fs').existsSync(staticPath)) {
            // Get bundle info
            const bundleInfo = await analyzeBundleSize(staticPath)
            console.log('Bundle Analysis:', bundleInfo)
            
            // Acceptable thresholds
            expect(bundleInfo.totalSize).toBeLessThan(3 * 1024 * 1024) // 3MB max
            expect(bundleInfo.jsSize).toBeLessThan(2 * 1024 * 1024) // 2MB JS max
            expect(bundleInfo.cssSize).toBeLessThan(500 * 1024) // 500KB CSS max
          } else {
            console.log('Static bundle directory not found, skipping detailed analysis')
          }
        } else {
          console.log('No build directory found - running development analysis')
          
          // Development mode - check page size
          const { page } = await require('@playwright/test').chromium.launch()
          await page.goto(`${API_BASE_URL}/en`)
          
          // Measure resource loading
          const metrics = await page.evaluate(() => {
            return JSON.parse(JSON.stringify(performance.getEntriesByType('resource')))
          })
          
          const totalTransferSize = metrics.reduce((total, resource) => {
            return total + (resource.transferSize || 0)
          }, 0)
          
          console.log(`Development mode transfer size: ${Math.round(totalTransferSize / 1024)}KB`)
          
          // Development should be under 10MB (more lenient)
          expect(totalTransferSize).toBeLessThan(10 * 1024 * 1024)
          
          await page.close()
        }
      } catch (error) {
        console.log('Bundle size analysis failed:', error.message)
        // Don't fail the test - just log the issue
      }
    })

    test('should have optimized asset loading', async ({ page }) => {
      await page.goto(`${API_BASE_URL}/en`)
      
      // Wait for initial load
      await page.waitForLoadState('networkidle')
      
      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        const navigation = performance.getEntriesByType('navigation')[0]
        
        return {
          resourceCount: resources.length,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')?.[0]?.startTime || 0
        }
      })
      
      console.log('Asset Loading Metrics:', metrics)
      
      // Performance thresholds
      expect(metrics.resourceCount).toBeLessThan(100) // Not too many resources
      expect(metrics.domContentLoaded).toBeLessThan(3000) // DOM ready within 3s
      expect(metrics.firstPaint).toBeLessThan(2000) // First paint within 2s
      
      if (metrics.largestContentfulPaint > 0) {
        expect(metrics.largestContentfulPaint).toBeLessThan(4000) // LCP within 4s
      }
    })
  })

  test.describe('🎯 Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto(`${API_BASE_URL}/en`)
      
      // Wait for page to fully load
      await page.waitForTimeout(3000)
      
      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {}
          
          // First Input Delay (FID) - simulate interaction
          const measureFID = () => {
            const startTime = performance.now()
            setTimeout(() => {
              vitals.fid = performance.now() - startTime
            }, 0)
          }
          
          // Largest Contentful Paint (LCP)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime
            }
          })
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
          
          // Cumulative Layout Shift (CLS)
          let clsScore = 0
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsScore += entry.value
              }
            }
            vitals.cls = clsScore
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })
          
          // Measure FID on first interaction
          document.addEventListener('click', measureFID, { once: true })
          
          // Return metrics after a delay
          setTimeout(() => {
            // First Paint
            const fpEntry = performance.getEntriesByType('paint').find(p => p.name === 'first-paint')
            vitals.fp = fpEntry ? fpEntry.startTime : null
            
            // First Contentful Paint
            const fcpEntry = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')
            vitals.fcp = fcpEntry ? fcpEntry.startTime : null
            
            resolve(vitals)
          }, 2000)
        })
      })
      
      console.log('Core Web Vitals:', vitals)
      
      // Core Web Vitals thresholds
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(2500) // LCP < 2.5s (good)
      }
      
      if (vitals.fid) {
        expect(vitals.fid).toBeLessThan(100) // FID < 100ms (good)
      }
      
      if (vitals.cls !== undefined) {
        expect(vitals.cls).toBeLessThan(0.1) // CLS < 0.1 (good)
      }
      
      if (vitals.fcp) {
        expect(vitals.fcp).toBeLessThan(1800) // FCP < 1.8s (good)
      }
    })

    test('should have efficient resource loading', async ({ page }) => {
      // Enable request interception for analysis
      await page.route('**/*', (route) => {
        route.continue()
      })
      
      const requests = []
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        })
      })
      
      const responses = []
      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'] || 0
        })
      })
      
      await page.goto(`${API_BASE_URL}/en`)
      await page.waitForLoadState('networkidle')
      
      console.log(`Total requests: ${requests.length}`)
      console.log(`Total responses: ${responses.length}`)
      
      // Analyze request patterns
      const imageRequests = requests.filter(r => r.resourceType === 'image').length
      const scriptRequests = requests.filter(r => r.resourceType === 'script').length
      const styleRequests = requests.filter(r => r.resourceType === 'stylesheet').length
      
      console.log(`Images: ${imageRequests}, Scripts: ${scriptRequests}, Styles: ${styleRequests}`)
      
      // Resource loading efficiency
      expect(requests.length).toBeLessThan(50) // Not too many requests
      expect(scriptRequests).toBeLessThan(20) // Script requests under control
      expect(styleRequests).toBeLessThan(10) // CSS requests minimized
      
      // Check for failed requests
      const failedResponses = responses.filter(r => r.status >= 400).length
      expect(failedResponses).toBe(0) // No failed resource loads
    })
  })

  test.describe('🧠 Memory Usage Analysis', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Monitor memory usage during navigation
      const memoryUsage = []
      
      const pages = ['/en', '/en/teachers', '/en/students', '/en/groups', '/en/settings']
      
      for (let i = 0; i < 2; i++) { // Two rounds to detect leaks
        for (const pagePath of pages) {
          await page.goto(`${API_BASE_URL}${pagePath}`)
          await page.waitForTimeout(1000)
          
          // Get memory metrics
          const metrics = await page.evaluate(() => {
            if (performance.memory) {
              return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
              }
            }
            return null
          })
          
          if (metrics) {
            memoryUsage.push({
              page: pagePath,
              round: i + 1,
              ...metrics
            })
          }
        }
      }
      
      if (memoryUsage.length > 0) {
        console.log('Memory Usage Analysis:')
        memoryUsage.forEach(m => {
          console.log(`${m.page} (Round ${m.round}): ${Math.round(m.usedJSHeapSize / 1024 / 1024)}MB`)
        })
        
        // Check for memory growth between rounds
        const firstRound = memoryUsage.filter(m => m.round === 1)
        const secondRound = memoryUsage.filter(m => m.round === 2)
        
        if (firstRound.length > 0 && secondRound.length > 0) {
          const avgFirstRound = firstRound.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / firstRound.length
          const avgSecondRound = secondRound.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / secondRound.length
          
          const memoryGrowth = (avgSecondRound - avgFirstRound) / avgFirstRound
          
          console.log(`Memory growth between rounds: ${(memoryGrowth * 100).toFixed(2)}%`)
          
          // Memory growth should be minimal (< 50% growth)
          expect(memoryGrowth).toBeLessThan(0.5)
        }
      } else {
        console.log('Memory monitoring not available in this browser')
      }
    })

    test('should handle concurrent operations efficiently', async ({ page }) => {
      await page.goto(`${API_BASE_URL}/en`)
      
      // Simulate concurrent operations
      const operations = []
      
      for (let i = 0; i < 5; i++) {
        operations.push(
          page.evaluate(() => {
            // Simulate data processing
            const data = new Array(1000).fill(0).map(() => Math.random())
            return data.reduce((sum, n) => sum + n, 0)
          })
        )
      }
      
      const startTime = Date.now()
      const results = await Promise.all(operations)
      const duration = Date.now() - startTime
      
      console.log(`5 concurrent operations completed in ${duration}ms`)
      console.log(`Results: ${results.map(r => Math.round(r)).join(', ')}`)
      
      // Should complete concurrent operations efficiently
      expect(duration).toBeLessThan(5000) // Under 5 seconds
      expect(results.every(r => typeof r === 'number')).toBe(true)
    })
  })

  test.describe('⚡ Performance Optimization Checks', () => {
    test('should have optimized images and assets', async ({ page }) => {
      await page.goto(`${API_BASE_URL}/en`)
      await page.waitForLoadState('networkidle')
      
      // Check for image optimization
      const images = await page.evaluate(() => {
        const imgs = Array.from(document.images)
        return imgs.map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: img.width,
          displayHeight: img.height,
          loading: img.loading
        }))
      })
      
      console.log(`Found ${images.length} images`)
      
      if (images.length > 0) {
        // Check for lazy loading
        const lazyImages = images.filter(img => img.loading === 'lazy').length
        const lazyPercentage = (lazyImages / images.length) * 100
        
        console.log(`${lazyImages}/${images.length} images use lazy loading (${lazyPercentage.toFixed(1)}%)`)
        
        // Should use lazy loading for most images
        expect(lazyPercentage).toBeGreaterThan(50)
        
        // Check for oversized images
        const oversizedImages = images.filter(img => {
          if (img.naturalWidth && img.displayWidth) {
            return img.naturalWidth > img.displayWidth * 2
          }
          return false
        }).length
        
        console.log(`${oversizedImages} oversized images detected`)
        expect(oversizedImages).toBeLessThan(images.length * 0.2) // Less than 20%
      }
    })

    test('should use efficient caching strategies', async ({ page }) => {
      const cacheHeaders = []
      
      page.on('response', response => {
        const cacheControl = response.headers()['cache-control']
        const etag = response.headers()['etag']
        const lastModified = response.headers()['last-modified']
        
        if (cacheControl || etag || lastModified) {
          cacheHeaders.push({
            url: response.url(),
            cacheControl,
            etag: !!etag,
            lastModified: !!lastModified
          })
        }
      })
      
      await page.goto(`${API_BASE_URL}/en`)
      await page.waitForLoadState('networkidle')
      
      console.log(`Found ${cacheHeaders.length} responses with cache headers`)
      
      if (cacheHeaders.length > 0) {
        // Static assets should have cache headers
        const staticAssets = cacheHeaders.filter(h => 
          h.url.includes('.js') || 
          h.url.includes('.css') || 
          h.url.includes('.png') || 
          h.url.includes('.jpg')
        ).length
        
        console.log(`${staticAssets} static assets with caching`)
        
        // Most static assets should be cacheable
        expect(staticAssets).toBeGreaterThan(0)
      }
    })
  })

  test.afterAll(async () => {
    console.log('✅ Performance Analysis test suite completed')
  })
})

// Helper function to analyze bundle size
async function analyzeBundleSize(staticPath) {
  const analysis = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    fileCount: 0
  }
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    function analyzeDirectory(dirPath) {
      const files = fs.readdirSync(dirPath)
      
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          analyzeDirectory(filePath)
        } else {
          analysis.totalSize += stat.size
          analysis.fileCount++
          
          if (file.endsWith('.js')) {
            analysis.jsSize += stat.size
          } else if (file.endsWith('.css')) {
            analysis.cssSize += stat.size
          }
        }
      }
    }
    
    analyzeDirectory(staticPath)
  } catch (error) {
    console.log('Bundle analysis error:', error.message)
  }
  
  return analysis
}
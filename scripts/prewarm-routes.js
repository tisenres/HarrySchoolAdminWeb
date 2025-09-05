#!/usr/bin/env node

/**
 * Route Pre-warming Script
 * Compiles all admin routes on server startup to eliminate first-visit delays
 */

const axios = require('axios')

const ROUTES_TO_PREWARM = [
  '/en',
  '/en/login', 
  '/en/dashboard',
  '/en/teachers',
  '/en/students', 
  '/en/groups',
  '/en/finance',
  '/en/rankings',
  '/en/settings',
  '/en/achievements',
  '/en/rewards',
  '/en/reports'
]

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
const MAX_RETRIES = 3
const TIMEOUT = 10000

async function prewarmRoute(route, retryCount = 0) {
  try {
    console.log(`🔄 Pre-warming: ${route}`)
    const startTime = Date.now()
    
    const response = await axios.get(`${BASE_URL}${route}`, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'PrewarmBot/1.0',
        'Accept': 'text/html,application/xhtml+xml'
      }
    })
    
    const duration = Date.now() - startTime
    console.log(`✅ Pre-warmed: ${route} (${response.status}) in ${duration}ms`)
    return { route, success: true, duration, status: response.status }
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`⚠️  Retrying: ${route} (attempt ${retryCount + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
      return prewarmRoute(route, retryCount + 1)
    }
    
    const duration = Date.now() - (error.config?.metadata?.startTime || Date.now())
    console.log(`❌ Failed to pre-warm: ${route} - ${error.message}`)
    return { route, success: false, duration, error: error.message }
  }
}

async function prewarmAllRoutes() {
  console.log(`🚀 Starting route pre-warming for ${ROUTES_TO_PREWARM.length} routes...`)
  console.log(`📡 Base URL: ${BASE_URL}`)
  
  const startTime = Date.now()
  const results = []
  
  // Pre-warm routes in parallel for speed, but with some throttling
  const CONCURRENT_LIMIT = 3
  const batches = []
  
  for (let i = 0; i < ROUTES_TO_PREWARM.length; i += CONCURRENT_LIMIT) {
    batches.push(ROUTES_TO_PREWARM.slice(i, i + CONCURRENT_LIMIT))
  }
  
  for (const batch of batches) {
    const batchPromises = batch.map(route => prewarmRoute(route))
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Small delay between batches to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  const totalDuration = Date.now() - startTime
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`\n📊 Pre-warming Summary:`)
  console.log(`✅ Successful: ${successful}/${ROUTES_TO_PREWARM.length}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total Duration: ${totalDuration}ms`)
  console.log(`📈 Average per route: ${Math.round(totalDuration / ROUTES_TO_PREWARM.length)}ms`)
  
  if (failed > 0) {
    console.log(`\n❌ Failed routes:`)
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.route}: ${r.error}`)
    })
  }
  
  console.log(`\n🎉 Route pre-warming completed!`)
  
  // Exit with error code if too many failures
  if (failed > ROUTES_TO_PREWARM.length / 2) {
    console.log(`⚠️  Too many failures (${failed}/${ROUTES_TO_PREWARM.length}), exiting with error`)
    process.exit(1)
  }
}

// Run pre-warming if called directly
if (require.main === module) {
  prewarmAllRoutes().catch(error => {
    console.error('💥 Pre-warming failed:', error)
    process.exit(1)
  })
}

module.exports = { prewarmAllRoutes, prewarmRoute }
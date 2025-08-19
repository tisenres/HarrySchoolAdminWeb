/**
 * Service Worker for Harry School CRM
 * Provides advanced browser-level caching for static assets and API responses
 */

const CACHE_NAME = 'harry-school-crm-v1.0.0'
const STATIC_CACHE = `${CACHE_NAME}-static`
const API_CACHE = `${CACHE_NAME}-api`
const IMAGE_CACHE = `${CACHE_NAME}-images`

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/dashboard/stats',
  '/api/teachers',
  '/api/students',
  '/api/groups',
  '/api/settings'
]

// Network-first strategy for dynamic content
const NETWORK_FIRST_PATTERNS = [
  /\/api\/dashboard/,
  /\/api\/teachers/,
  /\/api\/students/,
  /\/api\/groups/
]

// Cache-first strategy for static content
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static\//,
  /\/_next\/image/,
  /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg)$/
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Handle different types of requests
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirstStrategy(request))
  } else if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request))
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidateStrategy(request))
  } else {
    event.respondWith(networkFirstStrategy(request))
  }
})

/**
 * Cache-first strategy: Check cache first, fallback to network
 * Best for static assets that don't change often
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn('Network request failed:', request.url, error)
    return new Response('Network unavailable', { status: 503 })
  }
}

/**
 * Network-first strategy: Try network first, fallback to cache
 * Best for dynamic content that should be fresh
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.warn('Network request failed, trying cache:', request.url)
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response('Content unavailable', { status: 503 })
  }
}

/**
 * Stale-while-revalidate strategy: Return cache immediately, update in background
 * Best for API responses that can be slightly stale
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(API_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Fetch fresh data in the background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      // Only cache successful responses
      const headers = networkResponse.headers.get('content-type')
      if (headers && headers.includes('application/json')) {
        cache.put(request, networkResponse.clone())
      }
    }
    return networkResponse
  }).catch((error) => {
    console.warn('Background fetch failed:', request.url, error)
    return null
  })
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Wait for network if no cache
  return fetchPromise || new Response('Service unavailable', { status: 503 })
}

/**
 * Handle message events from the main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_INVALIDATE') {
    const { pattern } = event.data
    invalidateCacheByPattern(pattern)
  }
  
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    clearAllCaches()
  }
})

/**
 * Invalidate cache entries matching a pattern
 */
async function invalidateCacheByPattern(pattern) {
  const cacheNames = await caches.keys()
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    
    for (const request of requests) {
      if (new RegExp(pattern).test(request.url)) {
        await cache.delete(request)
      }
    }
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle offline actions when back online
  console.log('Background sync triggered')
}

/**
 * Push notifications support (for future use)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  )
})
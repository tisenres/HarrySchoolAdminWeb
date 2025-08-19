'use client'

/**
 * Service Worker Provider for Harry School CRM
 * Initializes and manages service worker lifecycle
 */

import { useEffect } from 'react'
import { initializeServiceWorker } from '@/lib/utils/service-worker'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize service worker when the component mounts
    initializeServiceWorker().catch(console.error)
  }, [])

  return <>{children}</>
}
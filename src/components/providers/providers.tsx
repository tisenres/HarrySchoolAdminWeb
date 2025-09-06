'use client'

import { OptimizedAuthProvider } from './optimized-auth-provider'
import { QueryProvider } from './query-provider'
import { ServiceWorkerProvider } from './service-worker-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <OptimizedAuthProvider>
      <QueryProvider>
        <ServiceWorkerProvider>
          {children}
        </ServiceWorkerProvider>
      </QueryProvider>
    </OptimizedAuthProvider>
  )
}
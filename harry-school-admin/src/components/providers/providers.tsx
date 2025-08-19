'use client'

import { AuthProvider } from './auth-provider'
import { QueryProvider } from './query-provider'
import { ServiceWorkerProvider } from './service-worker-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ServiceWorkerProvider>
          {children}
        </ServiceWorkerProvider>
      </QueryProvider>
    </AuthProvider>
  )
}
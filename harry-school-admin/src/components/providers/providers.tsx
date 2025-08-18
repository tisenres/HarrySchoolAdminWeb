'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from './auth-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (increased for better caching)
        retry: (failureCount, error: any) => {
          // Don't retry auth errors
          if (error?.status === 401 || error?.status === 403) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch on component mount if data is fresh
        refetchOnReconnect: 'always', // Refetch when connection is restored
        // Network mode for better offline handling
        networkMode: 'online',
      },
      mutations: {
        retry: 1, // Retry mutations once on failure
        // Network mode for mutations
        networkMode: 'online',
      },
    },
  }))

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthProvider>
  )
}
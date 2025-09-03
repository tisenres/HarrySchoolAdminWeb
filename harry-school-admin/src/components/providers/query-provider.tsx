'use client'

/**
 * React Query Provider for Harry School CRM
 * Provides optimized data fetching and caching throughout the app
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/react-query-optimized'
import { ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
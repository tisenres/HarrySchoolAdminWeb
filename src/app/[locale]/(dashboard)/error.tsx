'use client'

import { PageErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <PageErrorBoundary 
      error={error} 
      reset={reset}
      title="Dashboard Error"
      description="Unable to load the dashboard. Please try refreshing the page."
      showHome={false}
    />
  )
}
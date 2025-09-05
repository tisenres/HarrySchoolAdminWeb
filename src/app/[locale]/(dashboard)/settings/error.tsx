'use client'

import { PageErrorBoundary } from '@/components/ui/error-boundary'

export default function SettingsError({
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
      title="Settings Page Error"
      description="Unable to load settings. Please check your permissions and try again."
    />
  )
}
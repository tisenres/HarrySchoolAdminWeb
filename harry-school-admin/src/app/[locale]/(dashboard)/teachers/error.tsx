'use client'

import { PageErrorBoundary } from '@/components/ui/error-boundary'

export default function TeachersError({
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
      title="Teachers Page Error"
      description="Unable to load teacher data. This might be due to a network issue or server error."
    />
  )
}
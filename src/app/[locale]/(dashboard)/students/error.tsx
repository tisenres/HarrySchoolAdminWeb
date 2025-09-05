'use client'

import { PageErrorBoundary } from '@/components/ui/error-boundary'

export default function StudentsError({
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
      title="Students Page Error"
      description="Unable to load student data. This might be due to a network issue or server error."
    />
  )
}
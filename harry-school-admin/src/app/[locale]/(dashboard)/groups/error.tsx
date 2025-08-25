'use client'

import { PageErrorBoundary } from '@/components/ui/error-boundary'

export default function GroupsError({
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
      title="Groups Page Error"
      description="Unable to load group data. This might be due to a network issue or server error."
    />
  )
}
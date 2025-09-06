/**
 * Enhanced error boundary component for React Query
 * Provides graceful error handling with retry functionality
 */

import { ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface QueryBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  name?: string
}

function ErrorFallback({ 
  error, 
  resetErrorBoundary,
  name
}: { 
  error: Error
  resetErrorBoundary: () => void 
  name?: string
}) {
  return (
    <Card className="p-6 border-destructive bg-destructive/5">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-destructive">
          {name ? `${name} Error` : 'Something went wrong'}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred while loading this data.'}
      </p>
      <div className="flex gap-2">
        <Button 
          onClick={resetErrorBoundary} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button 
          onClick={() => window.location.reload()} 
          variant="ghost" 
          size="sm"
        >
          Reload Page
        </Button>
      </div>
    </Card>
  )
}

export function QueryBoundary({ 
  children, 
  fallback, 
  onReset, 
  name 
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => 
            fallback || (
              <ErrorFallback 
                error={error} 
                resetErrorBoundary={resetErrorBoundary}
                name={name}
              />
            )
          }
          onReset={() => {
            reset()
            onReset?.()
          }}
          onError={(error) => {
            console.error(`QueryBoundary Error${name ? ` (${name})` : ''}:`, error)
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
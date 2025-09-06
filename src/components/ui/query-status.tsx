/**
 * Smart query status component with loading, error, and empty states
 * Provides consistent UX patterns across all data loading scenarios
 */

import { Loader2, AlertCircle, Wifi, WifiOff, Database, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface QueryStatusProps {
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  isRefetching?: boolean
  isFetching?: boolean
  isEmpty?: boolean
  onRetry?: () => void
  children?: React.ReactNode
  name?: string
  showRefetchIndicator?: boolean
}

export function QueryStatus({ 
  isLoading, 
  isError, 
  error, 
  isRefetching,
  isFetching,
  isEmpty,
  onRetry,
  children,
  name,
  showRefetchIndicator = true
}: QueryStatusProps) {
  // Initial loading state
  if (isLoading && !isRefetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">Loading {name || 'data'}...</p>
            <p className="text-xs text-muted-foreground mt-1">Please wait a moment</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Error state
  if (isError) {
    return (
      <Card className="p-6 border-destructive bg-destructive/5">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">
              {name ? `Failed to load ${name.toLowerCase()}` : 'Failed to load data'}
            </h3>
            <p className="text-sm text-destructive/80 mt-1">
              {error?.message || 'An error occurred while fetching data.'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button 
            onClick={() => window.location.reload()} 
            variant="ghost" 
            size="sm"
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            Reload Page
          </Button>
        </div>
      </Card>
    )
  }
  
  // Empty state
  if (isEmpty) {
    return (
      <Card className="p-12 text-center border-dashed">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              No {name?.toLowerCase() || 'data'} found
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {name 
                ? `There are no ${name.toLowerCase()} to display at the moment.`
                : "There's no data to display at the moment."
              }
            </p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </Card>
    )
  }
  
  // Success state with optional refetch indicator
  return (
    <div className="relative">
      {/* Background refetch indicator */}
      {showRefetchIndicator && (isRefetching || isFetching) && (
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant="secondary" 
            className="gap-2 bg-background/90 backdrop-blur-sm border shadow-sm"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Updating...</span>
          </Badge>
        </div>
      )}
      
      {/* Connection status indicator (appears when offline) */}
      {typeof navigator !== 'undefined' && !navigator.onLine && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="destructive" className="gap-2">
            <WifiOff className="h-3 w-3" />
            <span className="text-xs">Offline</span>
          </Badge>
        </div>
      )}
      
      {children}
    </div>
  )
}

// Specialized components for common use cases
export function TableQueryStatus(props: Omit<QueryStatusProps, 'name'>) {
  return <QueryStatus {...props} name="Table Data" />
}

export function StatsQueryStatus(props: Omit<QueryStatusProps, 'name'>) {
  return <QueryStatus {...props} name="Statistics" />
}

export function ListQueryStatus(props: Omit<QueryStatusProps, 'name'>) {
  return <QueryStatus {...props} name="List" />
}
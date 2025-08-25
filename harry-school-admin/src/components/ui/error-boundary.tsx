'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    console.error('Component stack:', errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              {this.props.componentName 
                ? `Error loading ${this.props.componentName}` 
                : 'An error occurred while loading this component'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {this.state.error && (
                <div className="rounded-md bg-muted p-3 text-sm font-mono">
                  {this.state.error.message}
                </div>
              )}
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Page-level error boundary component for error.tsx files
export function PageErrorBoundary({ 
  error, 
  reset, 
  title = 'Something went wrong',
  description = 'An error occurred while loading this page.',
  showHome = true 
}: {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  showHome?: boolean
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details - Only in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                Technical Details
              </summary>
              <div className="bg-muted p-3 rounded-md font-mono text-xs break-all">
                <div className="text-destructive font-medium mb-1">
                  {error.name}: {error.message}
                </div>
                {error.digest && (
                  <div className="text-muted-foreground">
                    Digest: {error.digest}
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {showHome && (
              <Button variant="outline" asChild className="w-full">
                <a href="/en">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Go Home
                </a>
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            If this problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ErrorBoundary
'use client'

import { useEffect, useState } from 'react'
import { UnifiedRankingsInterface } from './unified-rankings-interface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RankingsWrapperProps {
  defaultTab?: string
  defaultUserType?: 'student' | 'teacher' | 'combined'
}

export function RankingsWrapper({ defaultTab, defaultUserType }: RankingsWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Simulate component loading
    const timer = setTimeout(() => {
      try {
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading rankings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load rankings')
        setIsLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="m-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error Loading Rankings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Reload Page
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  try {
    return (
      <UnifiedRankingsInterface 
        defaultTab={defaultTab}
        defaultUserType={defaultUserType}
      />
    )
  } catch (err) {
    console.error('Error rendering UnifiedRankingsInterface:', err)
    return (
      <Card className="m-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error Rendering Rankings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {err instanceof Error ? err.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Reload Page
          </Button>
        </CardContent>
      </Card>
    )
  }
}
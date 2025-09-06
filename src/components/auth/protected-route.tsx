'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/client-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireOrganization?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requireOrganization = false,
  fallback 
}: ProtectedRouteProps) {
  const { user, organization, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push('/login')
    }
  }, [user, loading, requireAuth, router])

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unauthorized state
  if (requireAuth && !user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-lg font-semibold">Authentication Required</h2>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Please log in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show no organization state
  if (requireOrganization && !organization) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-lg font-semibold">No Organization Access</h2>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Please contact an administrator for organization access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean
    requireOrganization?: boolean
  }
) {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute 
      requireAuth={options?.requireAuth}
      requireOrganization={options?.requireOrganization}
    >
      <Component {...props} />
    </ProtectedRoute>
  )

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}
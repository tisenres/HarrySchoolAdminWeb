'use client'

import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client'
import { Suspense } from 'react'
import { PageLoadingSkeleton } from '@/components/ui/skeleton-dashboard'
import { ClientAuthProvider } from '@/lib/auth/client-auth'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientAuthProvider>
      <ProtectedRoute requireAuth={true} requireOrganization={false}>
        <DashboardLayoutClient>
          <Suspense fallback={<PageLoadingSkeleton />}>
            {children}
          </Suspense>
        </DashboardLayoutClient>
      </ProtectedRoute>
    </ClientAuthProvider>
  )
}
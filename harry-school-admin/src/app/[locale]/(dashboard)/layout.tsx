import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client'
import { Suspense } from 'react'
import { PageLoadingSkeleton } from '@/components/ui/skeleton-dashboard'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Get user authentication on server side
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  const { locale } = await params

  // Redirect to login if not authenticated
  if (!user || error) {
    redirect(`/${locale}/login`)
  }

  // Optional: Verify user profile and organization access
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, is_active')
      .eq('id', user.id)
      .single()

    // Redirect to login if profile not found or inactive
    if (!profile || !profile.is_active) {
      redirect(`/${locale}/login`)
    }

    // Check for maintenance mode (for non-superadmins)
    if (profile.role !== 'superadmin') {
      const { data: maintenanceSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('organization_id', profile.organization_id)
        .eq('category', 'system')
        .eq('key', 'maintenance_mode')
        .maybeSingle()
      
      if (maintenanceSetting?.value === true) {
        redirect(`/${locale}/maintenance`)
      }
    }
  } catch (profileError) {
    console.error('Error checking user profile:', profileError)
    // Don't redirect on profile errors, just log and continue
  }

  return (
    <DashboardLayoutClient>
      <Suspense fallback={<PageLoadingSkeleton />}>
        {children}
      </Suspense>
    </DashboardLayoutClient>
  )
}
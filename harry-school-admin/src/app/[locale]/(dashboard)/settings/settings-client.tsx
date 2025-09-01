'use client'

import { useSearchParams } from 'next/navigation'
import { SettingsDashboard } from '@/components/admin/settings/settings-dashboard'
import { supabase } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

export function SettingsPageClient() {
  const searchParams = useSearchParams()
  
  // Get initial tab from URL params
  const initialTab = searchParams?.get('tab') || 'overview'

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['user-profile-settings'],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        return null
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', currentUser.id)
        .single()

      return {
        user: currentUser,
        organizationId: (profile as any)?.organization_id || null
      }
    },
    staleTime: 0, // Always fresh for button responsiveness
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !userProfile?.user || !userProfile?.organizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need to be logged in and associated with an organization to access settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <SettingsDashboard 
      initialTab={initialTab}
      userId={userProfile.user.id}
      organizationId={userProfile.organizationId}
    />
  )
}
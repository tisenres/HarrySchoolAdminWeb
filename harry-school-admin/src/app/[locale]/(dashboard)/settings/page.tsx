'use client'

import { useTranslations } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import { SettingsDashboard } from '@/components/admin/settings/settings-dashboard'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const params = useParams()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // supabase is already imported

  // Get initial tab from URL params
  const initialTab = searchParams?.get('tab') || 'overview'

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          setIsLoading(false)
          return
        }

        setUser(currentUser)

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', currentUser.id)
          .single()

        if (profile) {
          setOrganizationId(profile.organization_id)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndProfile()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !organizationId) {
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
    />
  )
}
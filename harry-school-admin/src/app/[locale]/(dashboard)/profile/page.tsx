'use client'

import { useProfile } from '@/lib/auth/client-auth'
import { ProfileView } from '@/components/admin/profile/profile-view'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const profile = useProfile()
  const t = useTranslations('profile')

  // Show loading state while profile is being fetched
  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Loading profile...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('subtitle')}</p>
        </div>
      </div>

      <ProfileView profile={profile} />
    </div>
  )
}
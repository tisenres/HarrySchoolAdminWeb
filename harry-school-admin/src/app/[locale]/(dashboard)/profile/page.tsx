import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfileView } from '@/components/admin/profile/profile-view'
import { getTranslations } from 'next-intl/server'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const profile = await getCurrentProfile()
  const t = await getTranslations('profile')

  if (!profile) {
    redirect('/sign-in')
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
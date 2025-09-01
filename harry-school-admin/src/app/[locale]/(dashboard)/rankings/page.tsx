// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { getTranslations } from 'next-intl/server'
import { WorkingRankings } from '@/components/admin/rankings/working-rankings'

interface RankingsPageProps {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    tab?: string
    userType?: 'student' | 'teacher' | 'combined'
  }>
}

export default async function RankingsPage({
  // params, // Temporarily commented out for TypeScript
}: RankingsPageProps) {
  // const { locale } = await params // Temporarily commented out for TypeScript
  const t = await getTranslations('rankings')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
      </div>

      <WorkingRankings />
    </div>
  )
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('rankings')
  
  return {
    title: t('title'),
    description: t('description'),
  }
}
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { UnifiedRankingsInterface } from '@/components/admin/rankings/unified-rankings-interface'

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
  params,
  searchParams
}: RankingsPageProps) {
  const { locale } = await params
  const awaitedSearchParams = await searchParams
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

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <UnifiedRankingsInterface 
          defaultTab={awaitedSearchParams.tab || 'overview'}
          defaultUserType={awaitedSearchParams.userType || 'combined'}
        />
      </Suspense>
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
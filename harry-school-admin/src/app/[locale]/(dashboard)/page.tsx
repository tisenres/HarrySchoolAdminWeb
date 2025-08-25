import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import DashboardClient from './dashboard-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('title')} - Harry School CRM`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} - Harry School CRM`,
      description: t('description'),
      locale,
    },
  }
}

export default function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return <DashboardClient />
}

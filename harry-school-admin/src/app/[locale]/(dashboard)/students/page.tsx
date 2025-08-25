import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import StudentsClient from './students-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'students' })

  return {
    title: `${t('title')} - Harry School CRM`,
    description: t('subtitle'),
    openGraph: {
      title: `${t('title')} - Harry School CRM`,
      description: t('subtitle'),
      locale,
    },
  }
}

export default function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return <StudentsClient />
}
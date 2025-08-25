import { useTranslations } from 'next-intl'
import { SettingsPageClient } from './settings-client'

export default function SettingsPage() {
  const t = useTranslations('settings')
  
  return <SettingsPageClient />
}
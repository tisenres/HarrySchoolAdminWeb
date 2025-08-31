'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { SettingsPageClient } from './settings-client'

export default function SettingsPage() {
  return <SettingsPageClient />
}
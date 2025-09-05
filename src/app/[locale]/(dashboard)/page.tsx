'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import DashboardClient from './dashboard-client'

export default function DashboardPage() {
  return <DashboardClient />
}
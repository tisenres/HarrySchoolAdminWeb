'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import GroupsClient from './groups-client'

export default function GroupsPage() {
  return <GroupsClient />
}
'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import TeachersClient from './teachers-client'

export default function TeachersPage() {
  return <TeachersClient />
}
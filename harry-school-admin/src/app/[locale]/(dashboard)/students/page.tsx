'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import StudentsClient from './students-client'

export default function StudentsPage() {
  return <StudentsClient />
}
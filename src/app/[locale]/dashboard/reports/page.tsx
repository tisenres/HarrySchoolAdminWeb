'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { ReportDashboard } from '@/components/admin/reports/report-dashboard'

export default function ReportsPage() {
  // In a real app, this would come from the authenticated user's context
  const organizationId = 'default-org-id'

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Generate comprehensive financial reports and analytics for your organization
        </p>
      </div>

      <ReportDashboard organizationId={organizationId} />
    </div>
  )
}
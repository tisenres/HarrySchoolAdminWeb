// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { Metadata } from 'next'
import RewardsManagementDashboard from '@/components/admin/rewards/rewards-management-dashboard'

export const metadata: Metadata = {
  title: 'Rewards Management | Harry School Admin',
  description: 'Manage reward catalog and student redemptions',
}

export default function RewardsPage() {
  return <RewardsManagementDashboard />
}
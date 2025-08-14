import { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import RewardsManagementDashboard from '@/components/admin/rewards/rewards-management-dashboard'

export const metadata: Metadata = {
  title: 'Rewards Management | Harry School Admin',
  description: 'Manage reward catalog and student redemptions',
}

export default function RewardsPage() {
  return <RewardsManagementDashboard />
}
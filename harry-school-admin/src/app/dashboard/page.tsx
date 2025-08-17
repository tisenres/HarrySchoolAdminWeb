import { Card } from '@/components/ui/card'
import { Users, GraduationCap, UserCheck, Settings } from 'lucide-react'
import { PendingReferralsWidget } from '@/components/admin/dashboard/pending-referrals-widget'

export const dynamic = 'force-dynamic'

const stats = [
  { name: 'Total Students', value: '0', icon: Users, color: 'text-blue-600' },
  { name: 'Active Groups', value: '0', icon: GraduationCap, color: 'text-green-600' },
  { name: 'Teachers', value: '0', icon: UserCheck, color: 'text-purple-600' },
  { name: 'Settings', value: 'Ready', icon: Settings, color: 'text-orange-600' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Harry School CRM Admin Panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-muted-foreground">No recent activity to display</p>
        </Card>
        
        <PendingReferralsWidget 
          organizationId="default-org" // This should come from auth context
          onViewAllReferrals={() => {
            // TODO: Navigate to referral management page
            console.log('Navigate to referral management')
          }}
          onContactReferral={(referral) => {
            // TODO: Handle referral contact
            console.log('Contact referral:', referral)
          }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">• Add new teacher</p>
            <p className="text-sm text-muted-foreground">• Create group</p>
            <p className="text-sm text-muted-foreground">• Enroll student</p>
            <p className="text-sm text-muted-foreground">• Manage referrals</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
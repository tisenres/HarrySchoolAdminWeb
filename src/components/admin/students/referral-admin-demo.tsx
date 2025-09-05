'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UserPlus, 
  Trophy, 
  CheckCircle,
  BarChart3,
  Users,
  Clock,
  Settings
} from 'lucide-react'

// Import our new admin components
import { ReferralStatusIndicator } from './referral-status-indicator'
import { ReferralConversionTracker } from './referral-conversion-tracker'
import { ReferralAnalyticsPanel } from './referral-analytics-panel'
import { PendingReferralsWidget } from '../dashboard/pending-referrals-widget'

/**
 * Demo component showcasing the integrated admin referral management functionality
 * This demonstrates how all components work together within existing admin patterns
 */
export function ReferralAdminDemo() {
  const [activeDemo, setActiveDemo] = useState<'table' | 'dashboard' | 'analytics' | 'workflow'>('table')

  const mockStudents = [
    { id: 'student-1', name: 'Alice Johnson', referrals: 3 },
    { id: 'student-2', name: 'Bob Smith', referrals: 1 },
    { id: 'student-3', name: 'Carol Davis', referrals: 0 }
  ]

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <span>Admin Referral Management Integration</span>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              ✅ Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Referral management has been seamlessly integrated into existing admin workflows.
            All functionality enhances current student administration without adding complexity.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Admin Integration Points</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✅ Referral status column in Students table</li>
                <li>✅ Pending referrals widget in admin dashboard</li>
                <li>✅ Conversion tracker in enrollment workflow</li>
                <li>✅ Analytics panel in student analytics section</li>
                <li>✅ Bulk referral actions in table operations</li>
                <li>✅ Individual referral management in student actions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span>Admin Workflows Enhanced</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Student enrollment process with referral tracking</li>
                <li>• Bulk student operations with referral insights</li>
                <li>• Dashboard overview with pending referral queue</li>
                <li>• Analytics reporting with referral performance</li>
                <li>• Individual student profile with referral history</li>
                <li>• Administrative oversight without complexity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Tabs value={activeDemo} onValueChange={(value: any) => setActiveDemo(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="table">Students Table</TabsTrigger>
          <TabsTrigger value="dashboard">Admin Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Panel</TabsTrigger>
          <TabsTrigger value="workflow">Enrollment Workflow</TabsTrigger>
        </TabsList>

        {/* Students Table Demo */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Referral Integration in Students Table</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The referral status column has been added to the existing students table,
                  showing referral activity alongside other student information.
                </p>
                
                {/* Mock Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 font-medium text-sm border-b">
                    Students with Referral Status
                  </div>
                  <div className="space-y-2 p-3">
                    {mockStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium">
                            {student.name[0]}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <ReferralStatusIndicator studentId={student.id} compact />
                          <Button variant="ghost" size="sm" className="text-xs">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">New Features Added:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Referral count badge with status indicators</li>
                    <li>• Bulk referral actions in table operations</li>
                    <li>• Individual referral management in student actions</li>
                    <li>• Sortable and filterable referral column</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Dashboard Demo */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Pending Referrals Dashboard Widget</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The pending referrals widget integrates into the main admin dashboard,
                  providing immediate visibility into referrals requiring attention.
                </p>
                
                <PendingReferralsWidget 
                  organizationId="demo-org"
                  onViewAllReferrals={() => console.log('View all referrals')}
                  onContactReferral={(referral) => console.log('Contact referral:', referral)}
                />
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Dashboard Integration:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Real-time pending referrals queue</li>
                    <li>• Quick contact actions for urgent referrals</li>
                    <li>• Conversion rate and success metrics</li>
                    <li>• Seamless workflow with existing dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Panel Demo */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Referral Analytics Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Referral analytics integrate with existing student analytics,
                  providing comprehensive performance insights within current reporting structure.
                </p>
                
                <ReferralAnalyticsPanel 
                  organizationId="demo-org"
                  onExportData={() => console.log('Export referral data')}
                />
                
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-1">Analytics Features:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Conversion rates and trend analysis</li>
                    <li>• Top performer identification</li>
                    <li>• Monthly breakdown and historical data</li>
                    <li>• Export capabilities for further analysis</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollment Workflow Demo */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Referral Conversion Workflow</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The conversion tracker integrates with student enrollment workflow,
                  allowing administrators to easily convert pending referrals to actual enrollments.
                </p>
                
                <ReferralConversionTracker 
                  referralData={{
                    referred_student_name: "John Doe",
                    referred_student_phone: "+1234567890",
                    referrer_name: "Alice Johnson",
                    referrer_id: "student-1",
                    referral_id: "ref-123"
                  }}
                  onConversionComplete={(studentId) => console.log('Conversion complete:', studentId)}
                  onCancel={() => console.log('Conversion cancelled')}
                  inline
                />
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-1">Workflow Integration:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Seamless referral to enrollment conversion</li>
                    <li>• Automatic point award upon successful enrollment</li>
                    <li>• Integration with existing student creation workflow</li>
                    <li>• Maintains referral tracking and attribution</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span>Integration Success Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800">Seamless Integration</h4>
              <p className="text-sm text-green-700">
                All components integrate naturally with existing admin workflows
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-800">Enhanced Efficiency</h4>
              <p className="text-sm text-blue-700">
                Referral management enhances rather than complicates admin tasks
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-800">Complete Oversight</h4>
              <p className="text-sm text-purple-700">
                Comprehensive referral insights within existing analytics structure
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
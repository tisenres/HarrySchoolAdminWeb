import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { ReportDashboard } from '@/components/admin/reports/report-dashboard'
import { getCurrentOrganization } from '@/lib/auth'
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Users, 
  Wallet, 
  Calendar,
  Download,
  Filter 
} from 'lucide-react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const t = await getTranslations('reports')
  const organization = await getCurrentOrganization()

  if (!organization?.id) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">
            No Organization Access
          </h1>
          <p className="text-muted-foreground mt-2">
            Please contact an administrator for access.
          </p>
        </div>
      </div>
    )
  }

  const reportTypes = [
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Monthly revenue trends, payment methods, and collection analysis',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'outstanding',
      title: 'Outstanding Balances',
      description: 'Student balances, overdue invoices, and collection priorities',
      icon: Wallet,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'payment_history',
      title: 'Payment History',
      description: 'Detailed payment records, trends, and student patterns',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'group_analysis',
      title: 'Group Analysis',
      description: 'Revenue by class, enrollment rates, and performance metrics',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'student_statement',
      title: 'Student Statements',
      description: 'Individual account statements, transaction history, and balances',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  const exportFormats = [
    {
      format: 'excel',
      title: 'Excel Export',
      description: 'Comprehensive data in multiple sheets with charts',
      icon: '📊',
    },
    {
      format: 'pdf',
      title: 'PDF Report',
      description: 'Professional formatted reports with visualizations',
      icon: '📄',
    },
    {
      format: 'csv',
      title: 'CSV Data',
      description: 'Raw data for external analysis and processing',
      icon: '📝',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive financial and operational reports
          </p>
        </div>
        <div className="flex gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Organization: {organization.name}
          </span>
        </div>
      </div>

      {/* Report Types Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((type) => {
          const IconComponent = type.icon
          return (
            <Card key={type.id} className={`p-6 ${type.bgColor} border-l-4 border-l-current`}>
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${type.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{type.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Export Formats */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Download className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Export Formats</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {exportFormats.map((format) => (
            <div key={format.format} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
              <span className="text-2xl">{format.icon}</span>
              <div>
                <h4 className="font-medium text-sm">{format.title}</h4>
                <p className="text-xs text-muted-foreground">{format.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Report Dashboard */}
      <Suspense fallback={
        <div className="space-y-6">
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="animate-pulse">
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </Card>
        </div>
      }>
        <ReportDashboard organizationId={organization.id} />
      </Suspense>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Reports</p>
              <p className="text-xl font-bold">{reportTypes.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Download className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Export Formats</p>
              <p className="text-xl font-bold">{exportFormats.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Real-time Data</p>
              <p className="text-xl font-bold">✓</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Highlights */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Report Features</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Filter className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-sm mb-1">Advanced Filters</h4>
            <p className="text-xs text-muted-foreground">Date ranges, student groups, payment status</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-medium text-sm mb-1">Data Visualization</h4>
            <p className="text-xs text-muted-foreground">Charts, graphs, and trend analysis</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-sm mb-1">Scheduled Reports</h4>
            <p className="text-xs text-muted-foreground">Automated report generation</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-orange-100 rounded-lg flex items-center justify-center mb-3">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="font-medium text-sm mb-1">Multi-format Export</h4>
            <p className="text-xs text-muted-foreground">Excel, PDF, CSV formats</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
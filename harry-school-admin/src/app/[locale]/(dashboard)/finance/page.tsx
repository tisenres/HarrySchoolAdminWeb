import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  Calendar,
  Plus,
  Download,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { getCurrentOrganization } from '@/lib/auth'
import { FinancialOverview } from '@/components/admin/finance/financial-overview'
import { TransactionHistory } from '@/components/admin/finance/transaction-history'
import { InvoiceList } from '@/components/admin/finance/invoice-list'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  const t = await getTranslations('finance')
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

  const quickActions = [
    {
      title: 'Record Payment',
      description: 'Add a new payment transaction',
      icon: CreditCard,
      href: '/finance/payments/new',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Create Invoice',
      description: 'Generate a new student invoice',
      icon: FileText,
      href: '/finance/invoices/new',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'View Reports',
      description: 'Financial reports and analytics',
      icon: TrendingUp,
      href: '/reports',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Outstanding Balances',
      description: 'Manage overdue payments',
      icon: AlertCircle,
      href: '/finance/outstanding',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  const financeModules = [
    {
      title: 'Payments',
      description: 'Record and track student payments',
      icon: CreditCard,
      href: '/finance/payments',
      stats: 'View all payments',
    },
    {
      title: 'Invoices',
      description: 'Generate and manage invoices',
      icon: FileText,
      href: '/finance/invoices',
      stats: 'Manage invoicing',
    },
    {
      title: 'Transactions',
      description: 'Complete transaction history',
      icon: DollarSign,
      href: '/finance/transactions',
      stats: 'Transaction log',
    },
    {
      title: 'Reports',
      description: 'Financial analytics and reports',
      icon: TrendingUp,
      href: '/reports',
      stats: 'Generate reports',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Finance Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage payments, invoices, and financial operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <Eye className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/finance/payments/new">
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <Suspense fallback={
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      }>
        <FinancialOverview organizationId={organization.id} />
      </Suspense>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common financial operations and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className={`h-auto p-4 flex-col space-y-2 ${action.bgColor} border-l-4 border-l-current hover:${action.bgColor}/80`}
                  asChild
                >
                  <Link href={action.href}>
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Finance Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Finance Modules
          </CardTitle>
          <CardDescription>
            Access different areas of financial management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {financeModules.map((module) => {
              const IconComponent = module.icon
              return (
                <Card key={module.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{module.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3">
                      {module.description}
                    </p>
                    <Button size="sm" className="w-full" asChild>
                      <Link href={module.href}>
                        {module.stats}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
            <CardDescription>
              Latest invoices and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            }>
              <InvoiceList 
                organizationId={organization.id} 
                limit={5} 
                compact={true}
              />
            </Suspense>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/finance/invoices">
                  View All Invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Latest financial transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            }>
              <TransactionHistory 
                organizationId={organization.id} 
                limit={5} 
                compact={true}
              />
            </Suspense>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/finance/transactions">
                  View All Transactions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
              <p className="text-xl font-bold">95.2%</p>
              <p className="text-xs text-green-600">+2.1% from last month</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Students</p>
              <p className="text-xl font-bold">247</p>
              <p className="text-xs text-blue-600">+12 this month</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Payment Time</p>
              <p className="text-xl font-bold">12 days</p>
              <p className="text-xs text-orange-600">-3 days improvement</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Help & Resources */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Finance Management Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-sm">
              <h4 className="font-medium mb-2">Getting Started</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Set up payment methods</li>
                <li>• Create your first invoice</li>
                <li>• Configure auto-reminders</li>
              </ul>
            </div>
            <div className="text-sm">
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Regular payment reconciliation</li>
                <li>• Monitor outstanding balances</li>
                <li>• Generate monthly reports</li>
              </ul>
            </div>
            <div className="text-sm">
              <h4 className="font-medium mb-2">Support</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Financial reporting guide</li>
                <li>• Payment processing help</li>
                <li>• Contact support team</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
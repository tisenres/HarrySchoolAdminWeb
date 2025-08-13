'use client'

import { useMemo, useState, useEffect } from 'react'
import { PaymentService } from '@/lib/services/finance/payments.service'
import { InvoiceService } from '@/lib/services/finance/invoices.service'
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'

interface FinancialOverviewProps {
  organizationId: string
}

export function FinancialOverview({ organizationId }: FinancialOverviewProps) {
  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true)
        const [paymentsData, invoicesData] = await Promise.all([
          PaymentService.list({ organizationId }),
          InvoiceService.list({ organizationId })
        ])
        
        setPayments(paymentsData || [])
        setInvoices(invoicesData || [])
        setTransactions([]) // Would load transaction data if available
      } catch (error) {
        console.error('Error loading financial data:', error)
        // Keep empty arrays as fallback
      } finally {
        setLoading(false)
      }
    }

    loadFinancialData()
  }, [organizationId])
  const stats = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const totalRevenue = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0)

    const totalOutstanding = invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total_amount - (inv.paid_amount || 0)), 0)

    const totalStudents = new Set(invoices.map((inv) => inv.student_id).filter(Boolean)).size

    const overdueInvoices = invoices.filter(
      (inv) =>
        inv.status === 'overdue' ||
        (inv.status !== 'paid' && new Date(inv.due_date) < now)
    ).length
    
    const recentPayments = payments
      .filter((p) => {
        const paymentDate = new Date(p.payment_date || p.created_at)
        return paymentDate >= thirtyDaysAgo
      })
      .reduce((sum, p) => sum + p.amount, 0)

    return {
      totalRevenue,
      totalInvoiced,
      totalOutstanding,
      totalStudents,
      overdueInvoices,
      recentPayments,
    }
  }, [payments, invoices])

  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentMonth(new Date())
  }, [])

  const monthlyRevenue = useMemo(() => {
    if (!currentMonth) return []
    
    const startDate = startOfMonth(currentMonth)
    const endDate = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const revenueByDay = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRevenue = payments
        .filter((p) => {
          const paymentDate = p.payment_date ? format(parseISO(p.payment_date), 'yyyy-MM-dd') : ''
          return paymentDate === dayStr && p.status === 'completed'
        })
        .reduce((sum, p) => sum + p.amount, 0)

      return {
        date: format(day, 'MMM dd'),
        revenue: dayRevenue,
      }
    })

    return revenueByDay
  }, [payments, currentMonth])

  const paymentMethodBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    payments.forEach((payment) => {
      const method = payment.payment_method_type || 'unknown'
      breakdown[method] = (breakdown[method] || 0) + payment.amount
    })

    return Object.entries(breakdown).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' '),
      value: amount,
    }))
  }, [payments])

  const invoiceStatusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    invoices.forEach((invoice) => {
      const status = invoice.status || 'draft'
      breakdown[status] = (breakdown[status] || 0) + 1
    })

    return Object.entries(breakdown).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
    }))
  }, [invoices])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.recentPayments.toFixed(2)} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueInvoices} overdue invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalInvoiced.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{invoices.length} total invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">With financial activity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Daily revenue for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Current status of all invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={invoiceStatusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {transaction.transaction_type === 'income' ? (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.transaction_date
                          ? format(parseISO(transaction.transaction_date), 'MMM dd, yyyy')
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-medium ${
                      transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}$
                    {transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
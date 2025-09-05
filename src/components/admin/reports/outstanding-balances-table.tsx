'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OutstandingBalancesTableProps {
  data: {
    balances: any[]
    overdueInvoices: any[]
    summary: {
      totalOutstanding: number
      studentCount: number
      overdueCount: number
      riskBreakdown: {
        high: number
        medium: number
        low: number
      }
    }
  }
}

export function OutstandingBalancesTable({ data }: OutstandingBalancesTableProps) {
  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<string, 'destructive' | 'warning' | 'secondary'> = {
      high: 'destructive',
      medium: 'warning',
      low: 'secondary',
    }
    return <Badge variant={variants[riskLevel] || 'secondary'}>{riskLevel?.toUpperCase()}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${data.summary.totalOutstanding.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Students with Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.studentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.summary.overdueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>High:</span>
                <span className="font-bold text-red-600">{data.summary.riskBreakdown.high}</span>
              </div>
              <div className="flex justify-between">
                <span>Medium:</span>
                <span className="font-bold text-orange-600">{data.summary.riskBreakdown.medium}</span>
              </div>
              <div className="flex justify-between">
                <span>Low:</span>
                <span className="font-bold text-green-600">{data.summary.riskBreakdown.low}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balances by Student</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Invoiced</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No outstanding balances
                  </TableCell>
                </TableRow>
              ) : (
                data.balances.map((balance) => (
                  <TableRow key={balance.student_id}>
                    <TableCell>
                      {balance.first_name} {balance.last_name}
                    </TableCell>
                    <TableCell>{balance.primary_phone || '-'}</TableCell>
                    <TableCell>${(balance.total_invoiced || 0).toFixed(2)}</TableCell>
                    <TableCell>${(balance.total_paid || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-red-600">
                      ${(balance.balance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{balance.last_payment_date || 'Never'}</TableCell>
                    <TableCell>{getRiskBadge(balance.risk_level)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
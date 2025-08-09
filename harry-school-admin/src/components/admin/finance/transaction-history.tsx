'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Database } from '@/types/database.types'

type Transaction = Database['public']['Tables']['financial_transactions']['Row'] & {
  student?: {
    first_name: string
    last_name: string
    student_id: string
  }
  group?: {
    name: string
  }
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  onApprove?: (transaction: Transaction) => void
}

export function TransactionHistory({ transactions, onApprove }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.student?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.student?.last_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter

    return matchesSearch && matchesType && matchesCategory
  })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />
      case 'expense':
      case 'fee':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'refund':
      case 'discount':
      case 'scholarship':
        return <TrendingDown className="h-4 w-4 text-blue-600" />
      case 'adjustment':
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
      income: { label: 'Income', variant: 'success' },
      expense: { label: 'Expense', variant: 'destructive' },
      refund: { label: 'Refund', variant: 'secondary' },
      adjustment: { label: 'Adjustment', variant: 'warning' },
      fee: { label: 'Fee', variant: 'destructive' },
      discount: { label: 'Discount', variant: 'outline' },
      scholarship: { label: 'Scholarship', variant: 'default' },
    }

    const config = typeConfig[type] || { label: type, variant: 'default' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const summary = transactions.reduce(
    (acc, transaction) => {
      if (transaction.transaction_type === 'income') {
        acc.totalIncome += transaction.amount
      } else if (transaction.transaction_type === 'expense') {
        acc.totalExpense += transaction.amount
      }
      acc.transactionCount++
      return acc
    },
    { totalIncome: 0, totalExpense: 0, transactionCount: 0 }
  )

  const netAmount = summary.totalIncome - summary.totalExpense

  const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.totalExpense.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
            {netAmount >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(netAmount).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View and manage all financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="fee">Fee</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
                <SelectItem value="scholarship">Scholarship</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category!}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{getTransactionIcon(transaction.transaction_type)}</TableCell>
                      <TableCell className="font-medium">
                        {transaction.transaction_number}
                      </TableCell>
                      <TableCell>
                        {transaction.transaction_date
                          ? format(new Date(transaction.transaction_date), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        {transaction.student ? (
                          <div>
                            <div className="font-medium">
                              {transaction.student.first_name} {transaction.student.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.student.student_id}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getTypeBadge(transaction.transaction_type)}</TableCell>
                      <TableCell>{transaction.category || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            transaction.transaction_type === 'income'
                              ? 'text-green-600'
                              : transaction.transaction_type === 'expense' ||
                                transaction.transaction_type === 'fee'
                              ? 'text-red-600'
                              : ''
                          }
                        >
                          {transaction.transaction_type === 'income' ? '+' : '-'}$
                          {transaction.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.requires_approval ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onApprove?.(transaction)}
                          >
                            Approve
                          </Button>
                        ) : transaction.approved_at ? (
                          <Badge variant="outline">Approved</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
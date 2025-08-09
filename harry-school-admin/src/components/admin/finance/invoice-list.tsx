'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  Mail,
  MoreHorizontal,
  Printer,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database } from '@/types/database.types'

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  student?: {
    first_name: string
    last_name: string
    student_id: string
  }
  group?: {
    name: string
  }
}

interface InvoiceListProps {
  invoices: Invoice[]
  onView?: (invoice: Invoice) => void
  onSend?: (invoice: Invoice) => void
  onPrint?: (invoice: Invoice) => void
  onDownload?: (invoice: Invoice) => void
  onCancel?: (invoice: Invoice) => void
}

export function InvoiceList({
  invoices,
  onView,
  onSend,
  onPrint,
  onDownload,
  onCancel,
}: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
      draft: { label: 'Draft', variant: 'secondary' },
      sent: { label: 'Sent', variant: 'default' },
      viewed: { label: 'Viewed', variant: 'outline' },
      paid: { label: 'Paid', variant: 'success' },
      partially_paid: { label: 'Partial', variant: 'warning' },
      overdue: { label: 'Overdue', variant: 'destructive' },
      cancelled: { label: 'Cancelled', variant: 'secondary' },
    }

    const config = statusConfig[status || 'draft']
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const calculateBalance = (invoice: Invoice) => {
    return invoice.total_amount - (invoice.paid_amount || 0)
  }

  const statusCounts = invoices.reduce((acc, invoice) => {
    const status = invoice.status || 'draft'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              Manage and track all invoices
            </CardDescription>
          </div>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All ({invoices.length})
              </DropdownMenuItem>
              {Object.entries(statusCounts).map(([status, count]) => (
                <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({count})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.student ? (
                        <div>
                          <div className="font-medium">
                            {invoice.student.first_name} {invoice.student.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.student.student_id}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>${(invoice.paid_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={calculateBalance(invoice) > 0 ? 'text-red-600' : 'text-green-600'}>
                        ${calculateBalance(invoice).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView?.(invoice)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSend?.(invoice)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPrint?.(invoice)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownload?.(invoice)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onCancel?.(invoice)}
                            className="text-destructive"
                          >
                            Cancel Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
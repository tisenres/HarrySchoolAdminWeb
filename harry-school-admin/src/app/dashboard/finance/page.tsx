'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaymentForm } from '@/components/admin/finance/payment-form'
import { InvoiceList } from '@/components/admin/finance/invoice-list'
import { TransactionHistory } from '@/components/admin/finance/transaction-history'
import { FinancialOverview } from '@/components/admin/finance/financial-overview'
import { toast } from '@/components/ui/use-toast'

export default function FinanceDashboard() {
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    setIsLoading(true)
    try {
      const [paymentsRes, invoicesRes, transactionsRes, studentsRes] = await Promise.all([
        fetch('/api/finance/payments'),
        fetch('/api/finance/invoices'),
        fetch('/api/finance/transactions'),
        fetch('/api/students'),
      ])

      if (!paymentsRes.ok || !invoicesRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch financial data')
      }

      const [paymentsData, invoicesData, transactionsData, studentsData] = await Promise.all([
        paymentsRes.json(),
        invoicesRes.json(),
        transactionsRes.json(),
        studentsRes.ok ? studentsRes.json() : [],
      ])

      setPayments(paymentsData)
      setInvoices(invoicesData)
      setTransactions(transactionsData)
      setStudents(studentsData)
    } catch (error) {
      console.error('Error fetching financial data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      await fetchFinancialData()
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      })
    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  }

  const handleInvoiceView = (invoice: any) => {
    console.log('View invoice:', invoice)
  }

  const handleInvoiceSend = async (invoice: any) => {
    try {
      const response = await fetch(`/api/finance/invoices/${invoice.id}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to send invoice')
      }

      await fetchFinancialData()
      toast({
        title: 'Success',
        description: 'Invoice sent successfully',
      })
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to send invoice',
        variant: 'destructive',
      })
    }
  }

  const handleTransactionApprove = async (transaction: any) => {
    try {
      const response = await fetch(`/api/finance/transactions/${transaction.id}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to approve transaction')
      }

      await fetchFinancialData()
      toast({
        title: 'Success',
        description: 'Transaction approved successfully',
      })
    } catch (error) {
      console.error('Error approving transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve transaction',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Finance Management</h1>
        <p className="text-muted-foreground">
          Manage payments, invoices, and financial transactions
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverview
            payments={payments}
            invoices={invoices}
            transactions={transactions}
          />
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-6">
            <PaymentForm
              students={students}
              invoices={invoices.filter((inv: any) => inv.status !== 'paid')}
              onSubmit={handlePaymentSubmit}
            />
            <TransactionHistory
              transactions={payments.map((p: any) => ({
                ...p,
                transaction_type: 'income',
                transaction_number: p.payment_number,
                description: `Payment ${p.payment_number}`,
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceList
            invoices={invoices}
            onView={handleInvoiceView}
            onSend={handleInvoiceSend}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistory
            transactions={transactions}
            onApprove={handleTransactionApprove}
          />
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <p>Finance settings coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
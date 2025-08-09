'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Plus,
  TrendingUp,
  Loader2
} from 'lucide-react'
import type { Student } from '@/types/student'
import { fadeVariants } from '@/lib/animations'

interface PaymentRecord {
  id: string
  amount: number
  date: string
  method: 'cash' | 'card' | 'bank_transfer' | 'online'
  status: 'completed' | 'pending' | 'failed'
  description?: string
  reference?: string
}

interface PaymentTrackerProps {
  student: Student
  paymentHistory?: PaymentRecord[]
  onUpdatePayment: (data: {
    student_id: string
    payment_status: Student['payment_status']
    balance: number
    payment_amount?: number
    payment_notes?: string
  }) => Promise<void>
  onAddPayment?: (payment: Omit<PaymentRecord, 'id'>) => Promise<void>
  loading?: boolean
}

export function PaymentTracker({
  student,
  paymentHistory = [],
  onUpdatePayment,
  onAddPayment,
}: PaymentTrackerProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('cash')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPaymentStatusColor = (status: Student['payment_status']) => {
    const colors = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-orange-100 text-orange-800 border-orange-200',
    } as const
    return colors[status] || colors.pending
  }

  const getPaymentStatusIcon = (status: Student['payment_status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'partial':
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const handleQuickPayment = async (amount: number, newStatus: Student['payment_status']) => {
    setProcessing(true)
    try {
      const newBalance = Math.max(0, student.balance - amount)
      await onUpdatePayment({
        student_id: student.id,
        payment_status: newStatus,
        balance: newBalance,
        payment_amount: amount,
        payment_notes: `Quick payment: ${formatCurrency(amount)}`
      })
      
      if (onAddPayment) {
        await onAddPayment({
          amount,
          date: new Date().toISOString(),
          method: 'cash',
          status: 'completed',
          description: 'Payment received',
        })
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleManualPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return
    
    setProcessing(true)
    try {
      const amount = parseFloat(paymentAmount)
      const newBalance = Math.max(0, student.balance - amount)
      const newStatus: Student['payment_status'] = 
        newBalance === 0 ? 'paid' : 
        newBalance < student.balance ? 'partial' : 
        student.payment_status

      await onUpdatePayment({
        student_id: student.id,
        payment_status: newStatus,
        balance: newBalance,
        payment_amount: amount,
        payment_notes: paymentNotes || `Payment via ${paymentMethod}`
      })
      
      if (onAddPayment) {
        await onAddPayment({
          amount,
          date: new Date().toISOString(),
          method: paymentMethod,
          status: 'completed',
          description: paymentNotes || 'Manual payment entry',
        })
      }

      setIsPaymentDialogOpen(false)
      setPaymentAmount('')
      setPaymentNotes('')
    } finally {
      setProcessing(false)
    }
  }

  const totalPayments = paymentHistory
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const recentPayments = paymentHistory
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={{ type: "spring", stiffness: 100 }}
      className="space-y-6"
    >
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            {getPaymentStatusIcon(student.payment_status)}
          </CardHeader>
          <CardContent>
            <Badge className={`${getPaymentStatusColor(student.payment_status)} text-sm`}>
              {student.payment_status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className={`h-4 w-4 ${student.balance > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(student.balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tuition Fee</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(student.tuition_fee || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPayments)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {student.balance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Quick Payment Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleQuickPayment(student.balance, 'paid')}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Pay Full Balance ({formatCurrency(student.balance)})
              </Button>
              
              {student.tuition_fee && student.tuition_fee < student.balance && (
                <Button
                  onClick={() => handleQuickPayment(student.tuition_fee!, 'partial')}
                  disabled={processing}
                  variant="outline"
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="mr-2 h-4 w-4" />
                  )}
                  Pay Monthly Fee ({formatCurrency(student.tuition_fee)})
                </Button>
              )}
              
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Custom Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Record a payment for {student.full_name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Payment Amount (UZS)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="method">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(value: PaymentRecord['method']) => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="online">Online Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Payment Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this payment..."
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsPaymentDialogOpen(false)}
                        disabled={processing}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleManualPayment}
                        disabled={processing || !paymentAmount}
                      >
                        {processing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Record Payment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={payment.status === 'completed' ? 'default' : 'secondary'}
                        className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {payment.method.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()}
                      </span>
                    </div>
                    {payment.description && (
                      <p className="text-sm text-muted-foreground">{payment.description}</p>
                    )}
                    {payment.reference && (
                      <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +{formatCurrency(payment.amount)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
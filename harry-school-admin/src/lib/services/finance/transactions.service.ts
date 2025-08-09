import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Transaction = Database['public']['Tables']['financial_transactions']['Row']
type TransactionInsert = Database['public']['Tables']['financial_transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['financial_transactions']['Update']

export class TransactionService {
  static async create(transaction: TransactionInsert) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert({
        ...transaction,
        transaction_number: transaction.transaction_number || `TXN-${Date.now()}`,
        transaction_date: transaction.transaction_date || new Date().toISOString(),
        currency: transaction.currency || 'USD',
      })
      .select()
      .single()

    if (error) throw error

    if (transaction.student_id) {
      await this.updateStudentBalance(transaction.student_id, data.id)
    }

    return data
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        group:groups(name, group_code),
        payment:payments(payment_number, amount),
        invoice:invoices(invoice_number, total_amount),
        approved_by_profile:profiles!financial_transactions_approved_by_fkey(full_name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async list(filters?: {
    studentId?: string
    groupId?: string
    transactionType?: string
    category?: string
    startDate?: string
    endDate?: string
    organizationId?: string
    requiresApproval?: boolean
  }) {
    let query = supabase
      .from('financial_transactions')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        group:groups(name),
        payment:payments(payment_number),
        invoice:invoices(invoice_number)
      `)
      .order('transaction_date', { ascending: false })

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId)
    }
    if (filters?.groupId) {
      query = query.eq('group_id', filters.groupId)
    }
    if (filters?.transactionType) {
      query = query.eq('transaction_type', filters.transactionType)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate)
    }
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId)
    }
    if (filters?.requiresApproval !== undefined) {
      query = query.eq('requires_approval', filters.requiresApproval)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async update(id: string, transaction: TransactionUpdate) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async approveTransaction(id: string, approvedBy: string) {
    const transaction = await this.getById(id)
    if (!transaction) throw new Error('Transaction not found')
    if (!transaction.requires_approval) throw new Error('Transaction does not require approval')

    const updates: TransactionUpdate = {
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      requires_approval: false,
    }

    return this.update(id, updates)
  }

  static async updateStudentBalance(studentId: string, transactionId: string) {
    const transaction = await this.getById(transactionId)
    if (!transaction) throw new Error('Transaction not found')

    const { data: previousBalance, error: balanceError } = await supabase
      .from('student_accounts')
      .select('current_balance')
      .eq('student_id', studentId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') throw balanceError

    const currentBalance = previousBalance?.current_balance || 0
    let newBalance = currentBalance

    switch (transaction.transaction_type) {
      case 'income':
        newBalance -= transaction.amount
        break
      case 'expense':
      case 'fee':
        newBalance += transaction.amount
        break
      case 'refund':
      case 'discount':
      case 'scholarship':
        newBalance -= transaction.amount
        break
      case 'adjustment':
        newBalance += transaction.amount
        break
    }

    await this.update(transactionId, {
      student_balance_after: newBalance,
      running_balance: newBalance,
    })

    if (previousBalance) {
      const { error: updateError } = await supabase
        .from('student_accounts')
        .update({
          current_balance: newBalance,
        })
        .eq('student_id', studentId)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('student_accounts')
        .insert({
          student_id: studentId,
          current_balance: newBalance,
          organization_id: transaction.organization_id,
        })

      if (insertError) throw insertError
    }
  }

  static async getTransactionSummary(organizationId: string, period?: { start: string; end: string }) {
    let query = supabase
      .from('financial_transactions')
      .select('amount, transaction_type, category, currency')
      .eq('organization_id', organizationId)

    if (period) {
      query = query.gte('transaction_date', period.start).lte('transaction_date', period.end)
    }

    const { data, error } = await query

    if (error) throw error

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      transactionCount: 0,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, { count: number; amount: number }>,
      byCurrency: {} as Record<string, number>,
    }

    data?.forEach((transaction) => {
      summary.transactionCount++
      
      if (transaction.transaction_type === 'income') {
        summary.totalIncome += transaction.amount
      } else if (transaction.transaction_type === 'expense') {
        summary.totalExpense += transaction.amount
      }
      
      const type = transaction.transaction_type
      summary.byType[type] = (summary.byType[type] || 0) + transaction.amount
      
      if (transaction.category) {
        if (!summary.byCategory[transaction.category]) {
          summary.byCategory[transaction.category] = { count: 0, amount: 0 }
        }
        summary.byCategory[transaction.category].count++
        summary.byCategory[transaction.category].amount += transaction.amount
      }
      
      const currency = transaction.currency
      summary.byCurrency[currency] = (summary.byCurrency[currency] || 0) + transaction.amount
    })

    summary.netAmount = summary.totalIncome - summary.totalExpense

    return summary
  }

  static async getCashFlow(organizationId: string, period: { start: string; end: string }) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_type, transaction_date')
      .eq('organization_id', organizationId)
      .gte('transaction_date', period.start)
      .lte('transaction_date', period.end)
      .order('transaction_date', { ascending: true })

    if (error) throw error

    const cashFlow: Array<{ date: string; income: number; expense: number; balance: number }> = []
    let runningBalance = 0

    const groupedByDate = (data || []).reduce((acc, transaction) => {
      const date = transaction.transaction_date?.split('T')[0] || ''
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0 }
      }
      
      if (transaction.transaction_type === 'income') {
        acc[date].income += transaction.amount
      } else if (transaction.transaction_type === 'expense') {
        acc[date].expense += transaction.amount
      }
      
      return acc
    }, {} as Record<string, { income: number; expense: number }>)

    Object.entries(groupedByDate).forEach(([date, amounts]) => {
      runningBalance += amounts.income - amounts.expense
      cashFlow.push({
        date,
        income: amounts.income,
        expense: amounts.expense,
        balance: runningBalance,
      })
    })

    return cashFlow
  }
}
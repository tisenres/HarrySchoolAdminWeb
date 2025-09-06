import { Database, Tables } from './database.generated'

// Type aliases for cleaner code
export type Invoice = Tables<'invoices'>
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type Payment = Tables<'payments'>
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type PaymentMethod = Tables<'payment_methods'>
export type PaymentSchedule = Tables<'payment_schedules'>
export type Discount = Tables<'discounts'>
export type Scholarship = Tables<'scholarships'>
export type FinancialTransaction = Tables<'financial_transactions'>
export type StudentAccount = Tables<'student_accounts'>
export type InvoiceLineItem = Tables<'invoice_line_items'>
export type PaymentInstallment = Tables<'payment_installments'>

// Enums
export type InvoiceStatus = Database['public']['Enums']['invoice_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentMethodType = Database['public']['Enums']['payment_method']
export type TransactionType = Database['public']['Enums']['transaction_type']
export type DiscountType = Database['public']['Enums']['discount_type']
export type ScholarshipType = Database['public']['Enums']['scholarship_type']
export type InstallmentStatus = Database['public']['Enums']['installment_status']

// View types
export type RevenueSummary = Tables<'revenue_summary'>
export type OutstandingBalance = Tables<'outstanding_balances'>
export type GroupRevenueAnalysis = Tables<'group_revenue_analysis'>
export type PaymentHistorySummary = Tables<'payment_history_summary'>

// Import student and group types
import type { Student } from './student'
import type { Group } from './group'

// Extended types with relations
export interface InvoiceWithDetails extends Invoice {
  student?: Student
  group?: Group
  line_items?: InvoiceLineItem[]
  payments?: Payment[]
  payment_schedule?: PaymentSchedule
}

export interface PaymentWithDetails extends Payment {
  student?: Student
  invoice?: Invoice
  payment_method?: PaymentMethod
  financial_transaction?: FinancialTransaction
}

export interface StudentAccountWithDetails extends StudentAccount {
  student?: Student
  payment_schedule?: PaymentSchedule
  preferred_payment_method?: PaymentMethod
  recent_payments?: Payment[]
  outstanding_invoices?: Invoice[]
}

// Form data types
export interface CreateInvoiceData {
  student_id: string
  group_id?: string
  due_date: string
  currency?: string
  tax_percentage?: number
  discount_id?: string
  discount_amount?: number
  scholarship_id?: string
  payment_schedule_id?: string
  notes?: string
  line_items: CreateInvoiceLineItemData[]
}

export interface CreateInvoiceLineItemData {
  description: string
  quantity: number
  unit_price: number
  tax_rate?: number
  discount_percentage?: number
  item_type: string
  group_id?: string
  period_start?: string
  period_end?: string
}

export interface CreatePaymentData {
  student_id: string
  invoice_id?: string
  amount: number
  currency?: string
  payment_method_type: PaymentMethodType
  payment_method_id?: string
  payment_date?: string
  payer_name?: string
  payer_contact?: Record<string, string | number>
  notes?: string
  external_reference?: string
}

export interface CreatePaymentScheduleData {
  name: string
  description?: string
  schedule_type: string
  installments_count: number
  start_date: string
  due_day_of_month?: number
  grace_period_days?: number
  late_fee_percentage?: number
  late_fee_amount?: number
  send_reminders?: boolean
  reminder_days_before?: number[]
  auto_generate_invoices?: boolean
}

export interface CreateDiscountData {
  name: string
  description?: string
  discount_type: DiscountType
  percentage?: number
  amount?: number
  valid_from?: string
  valid_until?: string
  usage_limit?: number
  applicable_groups?: string[]
  applies_to?: string
  min_enrollment_count?: number
  conditions?: Record<string, string | number | boolean>
  auto_apply?: boolean
  stackable?: boolean
}

export interface CreateScholarshipData {
  name: string
  description?: string
  scholarship_type: ScholarshipType
  percentage?: number
  amount?: number
  academic_year?: string
  valid_from?: string
  valid_until?: string
  available_slots?: number
  eligibility_criteria?: Record<string, string | number | boolean>
  min_grade_requirement?: number
  household_income_limit?: number
  application_required?: boolean
  application_deadline?: string
  required_documents?: string[]
  renewable?: boolean
  renewal_criteria?: Record<string, string | number | boolean>
}

// Report types
export interface FinancialSummaryReport {
  organization_id: string
  period_start: string
  period_end: string
  total_revenue: number
  total_invoiced: number
  total_collected: number
  total_outstanding: number
  collection_rate: number
  active_students: number
  average_payment: number
  total_refunds: number
  total_discounts: number
  total_scholarships: number
  currency: string
}

export interface StudentPaymentHistoryReport {
  student_id: string
  student_name: string
  transactions: Array<{
    date: string
    type: 'invoice' | 'payment' | 'refund' | 'adjustment'
    description: string
    amount: number
    balance: number
    reference: string
  }>
  current_balance: number
  total_invoiced: number
  total_paid: number
  total_refunded: number
}

export interface GroupFinancialReport {
  group_id: string
  group_name: string
  students: Array<{
    student_id: string
    student_name: string
    total_invoiced: number
    total_paid: number
    outstanding: number
    last_payment_date: string | null
    status: 'paid' | 'outstanding' | 'overdue'
  }>
  totals: {
    total_invoiced: number
    total_collected: number
    total_outstanding: number
    collection_rate: number
  }
}

// Filter types
export interface InvoiceFilters {
  status?: InvoiceStatus[]
  student_id?: string
  group_id?: string
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  overdue?: boolean
}

export interface PaymentFilters {
  status?: PaymentStatus[]
  student_id?: string
  invoice_id?: string
  payment_method?: PaymentMethodType[]
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  reconciled?: boolean
}

export interface TransactionFilters {
  type?: TransactionType[]
  category?: string[]
  student_id?: string
  group_id?: string
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  reconciled?: boolean
}

// Statistics types
export interface FinanceStatistics {
  total_revenue: number
  total_outstanding: number
  collection_rate: number
  overdue_invoices: number
  active_payment_plans: number
  students_with_balance: number
  average_payment_amount: number
  payment_methods_breakdown: Record<PaymentMethodType, number>
  monthly_revenue_trend: Array<{
    month: string
    revenue: number
    payments: number
  }>
}

// Export formats
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  columns?: string[]
  filters?: Record<string, unknown>
  include_headers?: boolean
  date_format?: string
  currency_format?: string
}

// Validation types
export interface PaymentValidation {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  suggested_amount?: number
  outstanding_balance?: number
}

export interface InvoiceValidation {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  calculated_total?: number
  tax_amount?: number
  discount_amount?: number
}

// Bulk operation types
export interface BulkInvoiceGenerationData {
  group_id: string
  due_date: string
  billing_period_start: string
  billing_period_end: string
  include_students?: string[]
  exclude_students?: string[]
  apply_discounts?: boolean
  apply_scholarships?: boolean
  send_notifications?: boolean
}

export interface BulkPaymentProcessingData {
  payments: Array<{
    student_id: string
    amount: number
    invoice_id?: string
    payment_method_id: string
  }>
  payment_date: string
  batch_reference?: string
  auto_allocate?: boolean
}

// Reconciliation types
export interface ReconciliationData {
  payment_id: string
  bank_statement_ref: string
  reconciled_amount: number
  reconciled_date: string
  notes?: string
}

export interface ReconciliationBatch {
  batch_id: string
  created_at: string
  created_by: string
  total_payments: number
  total_amount: number
  reconciled_count: number
  pending_count: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  errors?: string[]
}
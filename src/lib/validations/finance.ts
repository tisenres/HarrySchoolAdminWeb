import { z } from "zod"

// ============================================================================
// Finance-specific enums and base schemas
// ============================================================================

export const invoiceStatusSchema = z.enum([
  "draft",
  "sent", 
  "paid",
  "overdue",
  "cancelled",
  "refunded"
])

export const paymentStatusSchema = z.enum([
  "pending",
  "processing",
  "completed", 
  "failed",
  "cancelled",
  "refunded"
])

export const paymentMethodTypeSchema = z.enum([
  "cash",
  "bank_transfer",
  "credit_card",
  "debit_card",
  "digital_wallet",
  "check",
  "cryptocurrency"
])

export const transactionTypeSchema = z.enum([
  "payment",
  "refund",
  "adjustment",
  "fee",
  "discount",
  "scholarship"
])

export const discountTypeSchema = z.enum([
  "percentage",
  "fixed_amount",
  "tiered",
  "bulk",
  "early_bird",
  "loyalty"
])

export const scholarshipTypeSchema = z.enum([
  "academic",
  "need_based",
  "athletic",
  "merit",
  "diversity",
  "partial",
  "full"
])

export const installmentStatusSchema = z.enum([
  "pending",
  "due", 
  "paid",
  "overdue",
  "cancelled"
])

// ============================================================================
// Common field schemas
// ============================================================================

export const uuidSchema = z.string().uuid()
export const currencyCodeSchema = z.string().length(3).default("UZS")
export const amountSchema = z.number().nonnegative()
export const percentageSchema = z.number().min(0).max(100)
export const dateSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)), 
  "Invalid date format"
)

// ============================================================================
// Invoice schemas
// ============================================================================

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unit_price: amountSchema,
  tax_rate: percentageSchema.optional(),
  discount_percentage: percentageSchema.optional(),
  item_type: z.string().min(1),
  group_id: uuidSchema.optional(),
  period_start: dateSchema.optional(),
  period_end: dateSchema.optional(),
})

export const invoiceInsertSchema = z.object({
  organization_id: uuidSchema,
  student_id: uuidSchema,
  group_id: uuidSchema.optional(),
  
  // Invoice details
  invoice_number: z.string().optional(), // Auto-generated if not provided
  due_date: dateSchema,
  issue_date: dateSchema.optional(), // Defaults to current date
  
  // Financial details
  currency: currencyCodeSchema,
  tax_percentage: percentageSchema.optional(),
  discount_amount: amountSchema.optional(),
  discount_id: uuidSchema.optional(),
  scholarship_id: uuidSchema.optional(),
  
  // Payment terms
  payment_schedule_id: uuidSchema.optional(),
  payment_terms: z.string().optional(),
  
  // Status and notes
  status: invoiceStatusSchema.default("draft"),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  
  // Line items
  line_items: z.array(invoiceLineItemSchema).min(1),
})

export const invoiceUpdateSchema = invoiceInsertSchema.partial().omit({ 
  organization_id: true,
  line_items: true, // Line items updated separately
})

export const invoiceSearchSchema = z.object({
  query: z.string().optional(),
  status: z.array(invoiceStatusSchema).optional(),
  student_id: uuidSchema.optional(),
  group_id: uuidSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  min_amount: amountSchema.optional(),
  max_amount: amountSchema.optional(),
  overdue: z.boolean().optional(),
  payment_status: z.enum(["paid", "unpaid", "partial"]).optional(),
})

// ============================================================================
// Payment schemas
// ============================================================================

export const paymentInsertSchema = z.object({
  organization_id: uuidSchema,
  student_id: uuidSchema,
  invoice_id: uuidSchema.optional(),
  
  // Payment details
  amount: amountSchema,
  currency: currencyCodeSchema,
  payment_date: dateSchema.optional(), // Defaults to current date
  
  // Payment method
  payment_method_type: paymentMethodTypeSchema,
  payment_method_id: uuidSchema.optional(),
  
  // Payer information
  payer_name: z.string().optional(),
  payer_contact: z.record(z.string(), z.unknown()).optional(),
  
  // Transaction details
  external_reference: z.string().optional(),
  transaction_id: z.string().optional(),
  receipt_number: z.string().optional(),
  
  // Status and notes
  status: paymentStatusSchema.default("pending"),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

export const paymentUpdateSchema = paymentInsertSchema.partial().omit({ 
  organization_id: true 
})

export const paymentSearchSchema = z.object({
  query: z.string().optional(),
  status: z.array(paymentStatusSchema).optional(),
  student_id: uuidSchema.optional(),
  invoice_id: uuidSchema.optional(),
  payment_method: z.array(paymentMethodTypeSchema).optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  min_amount: amountSchema.optional(),
  max_amount: amountSchema.optional(),
  reconciled: z.boolean().optional(),
})

// ============================================================================
// Payment Schedule schemas
// ============================================================================

export const paymentScheduleInsertSchema = z.object({
  organization_id: uuidSchema,
  
  // Schedule details
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  schedule_type: z.enum(["fixed", "flexible", "custom"]).default("fixed"),
  
  // Installment configuration
  installments_count: z.number().int().min(1).max(24),
  start_date: dateSchema,
  due_day_of_month: z.number().int().min(1).max(31).optional(),
  
  // Fees and penalties
  grace_period_days: z.number().int().nonnegative().default(0),
  late_fee_percentage: percentageSchema.optional(),
  late_fee_amount: amountSchema.optional(),
  
  // Automation settings
  send_reminders: z.boolean().default(true),
  reminder_days_before: z.array(z.number().int().positive()).default([7, 3, 1]),
  auto_generate_invoices: z.boolean().default(false),
  
  // Status
  is_active: z.boolean().default(true),
})

export const paymentScheduleUpdateSchema = paymentScheduleInsertSchema.partial().omit({ 
  organization_id: true 
})

// ============================================================================
// Discount schemas
// ============================================================================

export const discountInsertSchema = z.object({
  organization_id: uuidSchema,
  
  // Discount details
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  discount_type: discountTypeSchema,
  
  // Discount value
  percentage: percentageSchema.optional(),
  amount: amountSchema.optional(),
  
  // Validity
  valid_from: dateSchema.optional(),
  valid_until: dateSchema.optional(),
  usage_limit: z.number().int().positive().optional(),
  used_count: z.number().int().nonnegative().default(0),
  
  // Applicability
  applicable_groups: z.array(uuidSchema).optional(),
  applies_to: z.enum(["all", "specific_groups", "students"]).default("all"),
  min_enrollment_count: z.number().int().positive().optional(),
  
  // Rules and conditions
  conditions: z.record(z.string(), z.unknown()).optional(),
  auto_apply: z.boolean().default(false),
  stackable: z.boolean().default(false),
  
  // Status
  is_active: z.boolean().default(true),
})

export const discountUpdateSchema = discountInsertSchema.partial().omit({ 
  organization_id: true 
})

// ============================================================================
// Scholarship schemas
// ============================================================================

export const scholarshipInsertSchema = z.object({
  organization_id: uuidSchema,
  
  // Scholarship details
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  scholarship_type: scholarshipTypeSchema,
  
  // Award amount
  percentage: percentageSchema.optional(),
  amount: amountSchema.optional(),
  max_amount_per_student: amountSchema.optional(),
  
  // Academic period
  academic_year: z.string().optional(),
  valid_from: dateSchema.optional(),
  valid_until: dateSchema.optional(),
  
  // Availability
  available_slots: z.number().int().positive().optional(),
  awarded_count: z.number().int().nonnegative().default(0),
  
  // Eligibility
  eligibility_criteria: z.record(z.string(), z.unknown()).optional(),
  min_grade_requirement: z.number().min(0).max(100).optional(),
  household_income_limit: amountSchema.optional(),
  
  // Application process
  application_required: z.boolean().default(true),
  application_deadline: dateSchema.optional(),
  required_documents: z.array(z.string()).default([]),
  
  // Renewal
  renewable: z.boolean().default(false),
  renewal_criteria: z.record(z.string(), z.unknown()).optional(),
  
  // Status
  is_active: z.boolean().default(true),
})

export const scholarshipUpdateSchema = scholarshipInsertSchema.partial().omit({ 
  organization_id: true 
})

// ============================================================================
// Bulk operations schemas
// ============================================================================

export const bulkInvoiceGenerationSchema = z.object({
  group_id: uuidSchema,
  due_date: dateSchema,
  billing_period_start: dateSchema,
  billing_period_end: dateSchema,
  
  // Student selection
  include_students: z.array(uuidSchema).optional(),
  exclude_students: z.array(uuidSchema).optional(),
  
  // Options
  apply_discounts: z.boolean().default(true),
  apply_scholarships: z.boolean().default(true),
  send_notifications: z.boolean().default(false),
  
  // Invoice details
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})

export const bulkPaymentProcessingSchema = z.object({
  payments: z.array(z.object({
    student_id: uuidSchema,
    amount: amountSchema,
    invoice_id: uuidSchema.optional(),
    payment_method_id: uuidSchema,
    notes: z.string().optional(),
  })),
  
  payment_date: dateSchema,
  batch_reference: z.string().optional(),
  auto_allocate: z.boolean().default(true),
})

// ============================================================================
// Report schemas
// ============================================================================

export const financialReportFiltersSchema = z.object({
  period_start: dateSchema,
  period_end: dateSchema,
  student_ids: z.array(uuidSchema).optional(),
  group_ids: z.array(uuidSchema).optional(),
  include_pending: z.boolean().default(true),
  include_refunded: z.boolean().default(false),
  currency: currencyCodeSchema.optional(),
})

export const exportOptionsSchema = z.object({
  format: z.enum(["csv", "excel", "pdf", "json"]),
  filename: z.string().optional(),
  columns: z.array(z.string()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  include_headers: z.boolean().default(true),
  date_format: z.string().default("YYYY-MM-DD"),
  currency_format: z.string().default("symbol"),
})

// ============================================================================
// Validation schemas
// ============================================================================

export const paymentValidationSchema = z.object({
  payment_data: paymentInsertSchema,
  validate_balance: z.boolean().default(true),
  validate_allocation: z.boolean().default(true),
})

export const invoiceValidationSchema = z.object({
  invoice_data: invoiceInsertSchema,
  validate_totals: z.boolean().default(true),
  validate_tax: z.boolean().default(true),
  validate_discounts: z.boolean().default(true),
})

// ============================================================================
// Reconciliation schemas
// ============================================================================

export const reconciliationSchema = z.object({
  payment_id: uuidSchema,
  bank_statement_ref: z.string().min(1),
  reconciled_amount: amountSchema,
  reconciled_date: dateSchema,
  variance_amount: z.number().optional(),
  notes: z.string().optional(),
})

export const reconciliationBatchSchema = z.object({
  batch_name: z.string().min(1).max(100),
  reconciliations: z.array(reconciliationSchema).min(1),
  auto_process: z.boolean().default(false),
})

// ============================================================================
// Export inferred types
// ============================================================================

export type InvoiceInsert = z.infer<typeof invoiceInsertSchema>
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>
export type InvoiceSearch = z.infer<typeof invoiceSearchSchema>
export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>

export type PaymentInsert = z.infer<typeof paymentInsertSchema>
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>
export type PaymentSearch = z.infer<typeof paymentSearchSchema>

export type PaymentScheduleInsert = z.infer<typeof paymentScheduleInsertSchema>
export type PaymentScheduleUpdate = z.infer<typeof paymentScheduleUpdateSchema>

export type DiscountInsert = z.infer<typeof discountInsertSchema>
export type DiscountUpdate = z.infer<typeof discountUpdateSchema>

export type ScholarshipInsert = z.infer<typeof scholarshipInsertSchema>
export type ScholarshipUpdate = z.infer<typeof scholarshipUpdateSchema>

export type BulkInvoiceGeneration = z.infer<typeof bulkInvoiceGenerationSchema>
export type BulkPaymentProcessing = z.infer<typeof bulkPaymentProcessingSchema>

export type FinancialReportFilters = z.infer<typeof financialReportFiltersSchema>
export type ExportOptions = z.infer<typeof exportOptionsSchema>

export type PaymentValidation = z.infer<typeof paymentValidationSchema>
export type InvoiceValidation = z.infer<typeof invoiceValidationSchema>

export type Reconciliation = z.infer<typeof reconciliationSchema>
export type ReconciliationBatch = z.infer<typeof reconciliationBatchSchema>
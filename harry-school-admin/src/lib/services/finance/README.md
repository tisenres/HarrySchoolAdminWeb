# Finance Services

This directory contains comprehensive finance service layers for the Harry School CRM Finance module. All services extend the `BaseService` class and provide full CRUD operations with proper TypeScript typing, error handling, validation, and audit logging.

## Services Overview

### 1. InvoiceService (`invoice-service.ts`)

Handles complete invoice management with line items and payment tracking.

**Key Features:**
- ✅ Create invoices with multiple line items
- ✅ Update invoice status (draft, sent, paid, overdue, cancelled)
- ✅ Send payment reminders with notifications
- ✅ Generate PDF invoices via edge functions
- ✅ Bulk invoice generation for groups
- ✅ Validate invoice data before creation
- ✅ Mark invoices as paid with audit trails
- ✅ Cancel invoices with reason tracking
- ✅ Get overdue invoices with filtering
- ✅ Advanced search and pagination
- ✅ Invoice statistics and analytics

**Usage Example:**
```typescript
import { invoiceService } from '@/lib/services'

// Create invoice
const invoice = await invoiceService.create({
  student_id: 'student-uuid',
  group_id: 'group-uuid',
  due_date: '2024-02-15',
  line_items: [
    {
      description: 'Monthly Tuition - English Course',
      quantity: 1,
      unit_price: 500000,
      item_type: 'tuition'
    }
  ]
})

// Send reminder
await invoiceService.sendReminder(invoice.id, 'Custom reminder message')

// Generate PDF
const pdf = await invoiceService.generatePDF(invoice.id)
```

### 2. PaymentService (`payment-service.ts`)

Manages payment processing, refunds, and reconciliation.

**Key Features:**
- ✅ Record payments with automatic allocation
- ✅ Process refunds with audit trails
- ✅ Allocate payments to specific invoices
- ✅ Handle partial payments
- ✅ Payment reconciliation with bank statements
- ✅ Batch reconciliation processing
- ✅ Bulk payment processing
- ✅ Update payment status with notifications
- ✅ Payment history tracking
- ✅ Unreconciled payments management
- ✅ Payment statistics and analytics

**Usage Example:**
```typescript
import { paymentService } from '@/lib/services'

// Record payment
const payment = await paymentService.create({
  student_id: 'student-uuid',
  invoice_id: 'invoice-uuid',
  amount: 500000,
  payment_method_type: 'bank_transfer',
  external_reference: 'TXN123456'
})

// Process refund
await paymentService.processRefund(payment.id, 100000, 'Partial refund requested')

// Reconcile payment
await paymentService.reconcile({
  payment_id: payment.id,
  bank_statement_ref: 'STMT-2024-001',
  reconciled_amount: 500000,
  reconciled_date: '2024-01-15'
})
```

### 3. FinanceReportService (`finance-report-service.ts`)

Generates comprehensive financial reports and analytics.

**Key Features:**
- ✅ Financial summary reports with KPIs
- ✅ Student payment history reports
- ✅ Group financial analysis
- ✅ Outstanding balances tracking
- ✅ Revenue analysis by group
- ✅ Aging reports for overdue payments
- ✅ Collection rate analysis
- ✅ Revenue forecasting
- ✅ Export capabilities (CSV, Excel, PDF, JSON)
- ✅ Payment method breakdowns
- ✅ Tax reporting
- ✅ Discount and scholarship impact reports
- ✅ Cash flow analysis
- ✅ Refund analysis
- ✅ Financial KPI dashboards

**Usage Example:**
```typescript
import { financeReportService } from '@/lib/services'

// Generate financial summary
const summary = await financeReportService.generateFinancialSummary({
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  include_pending: true,
  currency: 'UZS'
})

// Get outstanding balances
const outstanding = await financeReportService.getOutstandingBalances({
  overdue_only: true,
  min_amount: 100000
})

// Export report
const exportFile = await financeReportService.exportReport(
  'financial_summary',
  summary,
  { format: 'excel', filename: 'financial-summary-jan-2024.xlsx' }
)
```

### 4. PaymentScheduleService (`payment-schedule-service.ts`)

Manages installment payment plans and schedules.

**Key Features:**
- ✅ Create payment schedules with installments
- ✅ Generate installments for students
- ✅ Apply late fees to overdue payments
- ✅ Send automated payment reminders
- ✅ Track installment payments
- ✅ Update installment statuses
- ✅ Schedule statistics and analytics
- ✅ Clone existing schedules
- ✅ Get upcoming due installments
- ✅ Activate/deactivate schedules
- ✅ Grace period management
- ✅ Flexible scheduling options

**Usage Example:**
```typescript
import { paymentScheduleService } from '@/lib/services'

// Create payment schedule
const schedule = await paymentScheduleService.create({
  name: 'Monthly Payment Plan',
  schedule_type: 'fixed',
  installments_count: 12,
  start_date: '2024-01-01',
  due_day_of_month: 15,
  grace_period_days: 5,
  late_fee_percentage: 2,
  send_reminders: true,
  reminder_days_before: [7, 3, 1]
})

// Generate installments for student
const installments = await paymentScheduleService.generateInstallments(
  schedule.id,
  'student-uuid',
  6000000, // Total amount
  '2024-01-01'
)

// Apply late fees
await paymentScheduleService.applyLateFees(schedule.id)
```

## Common Features

All finance services include:

### 🔐 Security & Permissions
- Role-based access control (admin/superadmin required)
- Organization-based data isolation
- Audit logging for all operations
- Soft delete support with restoration

### 📊 Data Management
- Advanced filtering and search capabilities
- Pagination support with configurable limits
- Sorting by multiple fields
- Real-time subscriptions support
- Optimistic updates for better UX

### ⚡ Performance Optimizations
- Database function calls for complex operations
- Batch processing for bulk operations
- Efficient queries with proper indexing
- Transaction support for data consistency

### 🔍 Validation & Error Handling
- Comprehensive input validation using Zod schemas
- Detailed error messages with context
- Data integrity checks
- Business rule validation

### 📈 Analytics & Reporting
- Statistics generation
- Trend analysis
- KPI calculations
- Export capabilities in multiple formats

## Database Integration

All services integrate with Supabase database functions for complex operations:

- `create_invoice_with_items()` - Atomic invoice creation
- `create_payment_with_allocation()` - Payment processing with allocation
- `process_payment_refund()` - Refund handling
- `bulk_generate_invoices()` - Bulk invoice generation
- `generate_financial_summary()` - Report generation
- `apply_late_fees()` - Automated fee processing

## Error Handling

Services implement comprehensive error handling:

```typescript
try {
  const invoice = await invoiceService.create(invoiceData)
} catch (error) {
  // Detailed error with context
  console.error('Invoice creation failed:', error.message)
}
```

## Type Safety

All services use TypeScript with strict typing:

```typescript
// Full type inference
const payment: PaymentWithDetails = await paymentService.getByIdWithDetails(id)

// Validated input types
const createData: InvoiceInsert = invoiceInsertSchema.parse(rawData)
```

## Usage Patterns

### Service Instance Pattern
```typescript
// Use singleton instances
import { invoiceService, paymentService } from '@/lib/services'

// Or create new instances
import { InvoiceService } from '@/lib/services'
const customInvoiceService = new InvoiceService()
```

### Batch Operations
```typescript
// Bulk invoice generation
const result = await invoiceService.bulkGenerate({
  group_id: 'group-uuid',
  due_date: '2024-02-15',
  billing_period_start: '2024-01-01',
  billing_period_end: '2024-01-31',
  apply_discounts: true,
  send_notifications: false
})

console.log(`Generated ${result.success} invoices, ${result.failed} failed`)
```

### Real-time Updates
```typescript
// Subscribe to payment updates (when implemented)
const unsubscribe = paymentService.subscribe(
  'payments',
  { student_id: 'student-uuid' },
  (payment) => {
    console.log('Payment updated:', payment)
  }
)
```

## Best Practices

1. **Always use the singleton instances** from the index export
2. **Handle errors appropriately** with try-catch blocks
3. **Validate input data** using the provided Zod schemas
4. **Use pagination** for large datasets
5. **Check permissions** before sensitive operations
6. **Log important operations** for audit trails
7. **Use transactions** for multi-step operations
8. **Implement optimistic updates** for better UX

## Future Enhancements

The finance services are designed to be extensible:

- Integration with external payment gateways
- Advanced tax calculation engines
- Multi-currency support with exchange rates
- Automated backup and recovery
- Advanced analytics and ML predictions
- Mobile payment integrations
- Subscription management
- Advanced discount and scholarship rules
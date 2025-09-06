// Core services
export { TeacherService } from './teacher-service'
export { GroupService, groupService } from './group-service'
export { StudentService, studentService } from './student-service'
export { RealtimeService, realtimeService } from './realtime-service'

// Finance services
export { 
  InvoiceService,
  PaymentService,
  FinanceReportService,
  PaymentScheduleService,
  invoiceService,
  paymentService,
  financeReportService,
  paymentScheduleService
} from './finance'

// Base service for extending
export { BaseService } from './base-service'

// Service instances (singletons)
import { TeacherService } from './teacher-service'
import { GroupService } from './group-service'
import { StudentService } from './student-service'

// Create singleton instances
export const teacherService = new TeacherService()

// Re-export types
export type { TeacherService as TeacherServiceType } from './teacher-service'
export type { GroupService as GroupServiceType } from './group-service'
export type { StudentService as StudentServiceType } from './student-service'
export type { RealtimeService as RealtimeServiceType } from './realtime-service'

// Finance service types
export type { InvoiceService as InvoiceServiceType } from './finance/invoice-service'
export type { PaymentService as PaymentServiceType } from './finance/payment-service'
export type { FinanceReportService as FinanceReportServiceType } from './finance/finance-report-service'
export type { PaymentScheduleService as PaymentScheduleServiceType } from './finance/payment-schedule-service'
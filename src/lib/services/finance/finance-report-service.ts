import { BaseService } from '../base-service'
import { 
  financialReportFiltersSchema,
  exportOptionsSchema,
  paginationSchema 
} from '@/lib/validations/finance'
import type { 
  FinancialSummaryReport,
  StudentPaymentHistoryReport,
  GroupFinancialReport,
  RevenueSummary,
  OutstandingBalance,
  GroupRevenueAnalysis,
  PaymentHistorySummary,
  FinanceStatistics,
  ExportOptions,
  ExportFormat
} from '@/types/finance'
import type { z } from 'zod'

export class FinanceReportService extends BaseService {
  constructor() {
    super('financial_reports') // Assuming a reports table exists or using generic base
  }

  /**
   * Generate financial summary report
   */
  async generateFinancialSummary(
    filters: z.infer<typeof financialReportFiltersSchema>
  ): Promise<FinancialSummaryReport> {
    const validatedFilters = financialReportFiltersSchema.parse(filters)
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_financial_summary', {
      p_organization_id: organizationId,
      p_period_start: validatedFilters.period_start,
      p_period_end: validatedFilters.period_end,
      p_student_ids: validatedFilters.student_ids || null,
      p_group_ids: validatedFilters.group_ids || null,
      p_include_pending: validatedFilters.include_pending,
      p_include_refunded: validatedFilters.include_refunded,
      p_currency: validatedFilters.currency || 'UZS'
    })
    
    if (error) {
      throw new Error(`Failed to generate financial summary: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'REPORT',
      'financial-summary',
      `Financial Summary Report`,
      null,
      { filters: validatedFilters, data },
      `Generated financial summary report for ${validatedFilters.period_start} to ${validatedFilters.period_end}`
    )
    
    return {
      organization_id: organizationId,
      period_start: validatedFilters.period_start,
      period_end: validatedFilters.period_end,
      currency: validatedFilters.currency || 'UZS',
      ...data
    }
  }

  /**
   * Generate student payment history report
   */
  async generateStudentPaymentHistory(
    studentId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<StudentPaymentHistoryReport> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_student_payment_history', {
      p_organization_id: organizationId,
      p_student_id: studentId,
      p_period_start: periodStart || null,
      p_period_end: periodEnd || null
    })
    
    if (error) {
      throw new Error(`Failed to generate student payment history: ${error.message}`)
    }
    
    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', studentId)
      .single()
    
    if (studentError) {
      throw new Error(`Failed to get student info: ${studentError.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'REPORT',
      studentId,
      `Student Payment History Report`,
      null,
      { student_id: studentId, data },
      `Generated payment history report for student ${student.first_name} ${student.last_name}`
    )
    
    return {
      student_id: studentId,
      student_name: `${student.first_name} ${student.last_name}`,
      ...data
    }
  }

  /**
   * Generate group financial report
   */
  async generateGroupFinancialReport(
    groupId: string,
    includePending: boolean = true
  ): Promise<GroupFinancialReport> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_group_financial_report', {
      p_organization_id: organizationId,
      p_group_id: groupId,
      p_include_pending: includePending
    })
    
    if (error) {
      throw new Error(`Failed to generate group financial report: ${error.message}`)
    }
    
    // Get group info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()
    
    if (groupError) {
      throw new Error(`Failed to get group info: ${groupError.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'REPORT',
      groupId,
      `Group Financial Report`,
      null,
      { group_id: groupId, data },
      `Generated financial report for group ${group.name}`
    )
    
    return {
      group_id: groupId,
      group_name: group.name,
      ...data
    }
  }

  /**
   * Get outstanding balances report
   */
  async getOutstandingBalances(
    filters?: {
      student_id?: string;
      group_id?: string;
      overdue_only?: boolean;
      min_amount?: number;
    }
  ): Promise<OutstandingBalance[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    let query = supabase
      .from('outstanding_balances')
      .select('*')
      .eq('organization_id', organizationId)
    
    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id)
    }
    
    if (filters?.group_id) {
      query = query.eq('group_id', filters.group_id)
    }
    
    if (filters?.overdue_only) {
      const today = new Date().toISOString().split('T')[0]
      query = query.lt('oldest_due_date', today)
    }
    
    if (filters?.min_amount) {
      query = query.gte('total_outstanding', filters.min_amount)
    }
    
    query = query.order('total_outstanding', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Failed to get outstanding balances: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Get revenue analysis by group
   */
  async getGroupRevenueAnalysis(
    periodStart: string,
    periodEnd: string
  ): Promise<GroupRevenueAnalysis[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_group_revenue_analysis', {
      p_organization_id: organizationId,
      p_period_start: periodStart,
      p_period_end: periodEnd
    })
    
    if (error) {
      throw new Error(`Failed to get group revenue analysis: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Get finance statistics dashboard
   */
  async getFinanceStatistics(
    periodStart?: string,
    periodEnd?: string
  ): Promise<FinanceStatistics> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_finance_statistics', {
      p_organization_id: organizationId,
      p_period_start: periodStart || null,
      p_period_end: periodEnd || null
    })
    
    if (error) {
      throw new Error(`Failed to get finance statistics: ${error.message}`)
    }
    
    return data
  }

  /**
   * Generate aging report (overdue invoices grouped by age)
   */
  async generateAgingReport(): Promise<{
    current: { count: number; amount: number };
    overdue_1_30: { count: number; amount: number };
    overdue_31_60: { count: number; amount: number };
    overdue_61_90: { count: number; amount: number };
    overdue_90_plus: { count: number; amount: number };
    total: { count: number; amount: number };
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_aging_report', {
      p_organization_id: organizationId
    })
    
    if (error) {
      throw new Error(`Failed to generate aging report: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get collection rate analysis
   */
  async getCollectionRateAnalysis(
    periodStart: string,
    periodEnd: string,
    groupBy: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<Array<{
    period: string;
    invoiced_amount: number;
    collected_amount: number;
    collection_rate: number;
    outstanding_amount: number;
  }>> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_collection_rate_analysis', {
      p_organization_id: organizationId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_group_by: groupBy
    })
    
    if (error) {
      throw new Error(`Failed to get collection rate analysis: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Generate revenue forecast
   */
  async generateRevenueForecast(
    forecastMonths: number = 6
  ): Promise<Array<{
    month: string;
    projected_revenue: number;
    confirmed_revenue: number;
    potential_revenue: number;
    confidence_level: 'high' | 'medium' | 'low';
  }>> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_revenue_forecast', {
      p_organization_id: organizationId,
      p_forecast_months: forecastMonths
    })
    
    if (error) {
      throw new Error(`Failed to generate revenue forecast: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Export financial report to various formats
   */
  async exportReport(
    reportType: 'financial_summary' | 'student_payments' | 'group_analysis' | 'outstanding_balances' | 'aging_report',
    reportData: any,
    options: z.infer<typeof exportOptionsSchema>
  ): Promise<{ url: string; filename: string }> {
    const validatedOptions = exportOptionsSchema.parse(options)
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    // Call edge function to generate export
    const { data, error } = await supabase.functions.invoke('export-financial-report', {
      body: {
        report_type: reportType,
        report_data: reportData,
        export_options: validatedOptions,
        user_id: user.id
      }
    })
    
    if (error) {
      throw new Error(`Failed to export report: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'EXPORT',
      `${reportType}-export`,
      `Report Export: ${reportType}`,
      null,
      { format: validatedOptions.format, filename: data.filename },
      `Exported ${reportType} report as ${validatedOptions.format.toUpperCase()}`
    )
    
    return {
      url: data.download_url,
      filename: data.filename
    }
  }

  /**
   * Get payment method breakdown
   */
  async getPaymentMethodBreakdown(
    periodStart: string,
    periodEnd: string
  ): Promise<Array<{
    payment_method: string;
    transaction_count: number;
    total_amount: number;
    percentage_of_total: number;
    average_transaction: number;
  }>> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_payment_method_breakdown', {
      p_organization_id: organizationId,
      p_period_start: periodStart,
      p_period_end: periodEnd
    })
    
    if (error) {
      throw new Error(`Failed to get payment method breakdown: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Generate tax report
   */
  async generateTaxReport(
    periodStart: string,
    periodEnd: string
  ): Promise<{
    total_sales: number;
    taxable_sales: number;
    tax_collected: number;
    tax_rate_breakdown: Array<{
      tax_rate: number;
      sales_amount: number;
      tax_amount: number;
    }>;
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_tax_report', {
      p_organization_id: organizationId,
      p_period_start: periodStart,
      p_period_end: periodEnd
    })
    
    if (error) {
      throw new Error(`Failed to generate tax report: ${error.message}`)
    }
    
    return data
  }

  /**
   * Generate discount and scholarship impact report
   */
  async generateDiscountScholarshipReport(
    periodStart: string,
    periodEnd: string
  ): Promise<{
    total_discounts_given: number;
    total_scholarships_awarded: number;
    discount_breakdown: Array<{
      discount_name: string;
      times_used: number;
      total_amount: number;
      affected_students: number;
    }>;
    scholarship_breakdown: Array<{
      scholarship_name: string;
      recipients: number;
      total_amount: number;
      academic_performance_impact?: number;
    }>;
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_discount_scholarship_report', {
      p_organization_id: organizationId,
      p_period_start: periodStart,
      p_period_end: periodEnd
    })
    
    if (error) {
      throw new Error(`Failed to generate discount/scholarship report: ${error.message}`)
    }
    
    return data
  }

  /**
   * Generate cash flow report
   */
  async generateCashFlowReport(
    periodStart: string,
    periodEnd: string,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<Array<{
    period: string;
    cash_in: number;
    cash_out: number;
    net_cash_flow: number;
    cumulative_balance: number;
  }>> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_cash_flow_report', {
      p_organization_id: organizationId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_group_by: groupBy
    })
    
    if (error) {
      throw new Error(`Failed to generate cash flow report: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Get refund analysis
   */
  async getRefundAnalysis(
    periodStart: string,
    periodEnd: string
  ): Promise<{
    total_refunds: number;
    total_refund_amount: number;
    refund_rate: number;
    reasons_breakdown: Array<{
      reason: string;
      count: number;
      amount: number;
    }>;
    trend: Array<{
      month: string;
      refunds: number;
      amount: number;
    }>;
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_refund_analysis', {
      p_organization_id: organizationId,
      p_period_start: periodStart,
      p_period_end: periodEnd
    })
    
    if (error) {
      throw new Error(`Failed to get refund analysis: ${error.message}`)
    }
    
    return data
  }

  /**
   * Generate financial KPI dashboard data
   */
  async getFinancialKPIs(
    currentPeriodStart: string,
    currentPeriodEnd: string,
    previousPeriodStart?: string,
    previousPeriodEnd?: string
  ): Promise<{
    current_period: {
      total_revenue: number;
      net_revenue: number;
      collection_rate: number;
      average_payment_time: number;
      active_students_count: number;
      revenue_per_student: number;
    };
    previous_period?: {
      total_revenue: number;
      net_revenue: number;
      collection_rate: number;
      average_payment_time: number;
      active_students_count: number;
      revenue_per_student: number;
    };
    growth_metrics?: {
      revenue_growth: number;
      student_growth: number;
      collection_rate_change: number;
      payment_time_change: number;
    };
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_financial_kpis', {
      p_organization_id: organizationId,
      p_current_start: currentPeriodStart,
      p_current_end: currentPeriodEnd,
      p_previous_start: previousPeriodStart || null,
      p_previous_end: previousPeriodEnd || null
    })
    
    if (error) {
      throw new Error(`Failed to get financial KPIs: ${error.message}`)
    }
    
    return data
  }
}
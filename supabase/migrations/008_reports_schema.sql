-- Reports Module Schema Migration
-- Harry School CRM - Phase 4

-- Materialized View for Revenue Reports
CREATE MATERIALIZED VIEW revenue_summary AS
SELECT 
  organization_id,
  DATE_TRUNC('month', payment_date) as month,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(*) as total_payments,
  SUM(amount) as gross_revenue,
  SUM(processing_fee) as total_fees,
  SUM(net_amount) as net_revenue,
  SUM(refund_amount) as total_refunds,
  AVG(amount) as average_payment,
  currency
FROM payments
WHERE status = 'completed' AND deleted_at IS NULL
GROUP BY organization_id, DATE_TRUNC('month', payment_date), currency;

-- Index for revenue summary
CREATE UNIQUE INDEX idx_revenue_summary ON revenue_summary(organization_id, month, currency);

-- Materialized View for Outstanding Balances
CREATE MATERIALIZED VIEW outstanding_balances AS
SELECT 
  sa.organization_id,
  sa.student_id,
  s.first_name,
  s.last_name,
  s.phone,
  sa.balance,
  sa.total_invoiced,
  sa.total_paid,
  sa.last_payment_date,
  CASE 
    WHEN sa.balance < -1000 THEN 'high_risk'
    WHEN sa.balance < -500 THEN 'medium_risk'
    WHEN sa.balance < 0 THEN 'low_risk'
    ELSE 'no_risk'
  END as risk_level,
  DATE_PART('day', CURRENT_DATE - sa.last_payment_date) as days_since_payment
FROM student_accounts sa
JOIN students s ON s.id = sa.student_id
WHERE sa.balance < 0;

-- Index for outstanding balances
CREATE INDEX idx_outstanding_balances_org ON outstanding_balances(organization_id);
CREATE INDEX idx_outstanding_balances_risk ON outstanding_balances(risk_level);

-- Materialized View for Group Revenue Analysis
CREATE MATERIALIZED VIEW group_revenue_analysis AS
SELECT 
  i.organization_id,
  i.group_id,
  g.name as group_name,
  COUNT(DISTINCT i.student_id) as student_count,
  COUNT(i.id) as invoice_count,
  SUM(i.total_amount) as total_invoiced,
  SUM(i.paid_amount) as total_collected,
  SUM(i.total_amount - i.paid_amount) as outstanding_amount,
  AVG(i.total_amount) as avg_invoice_amount,
  SUM(i.discount_amount) as total_discounts,
  SUM(i.scholarship_amount) as total_scholarships
FROM invoices i
JOIN groups g ON g.id = i.group_id
WHERE i.deleted_at IS NULL AND i.status NOT IN ('cancelled', 'draft')
GROUP BY i.organization_id, i.group_id, g.name;

-- Index for group revenue analysis
CREATE INDEX idx_group_revenue_org ON group_revenue_analysis(organization_id);
CREATE INDEX idx_group_revenue_group ON group_revenue_analysis(group_id);

-- Materialized View for Teacher Performance Metrics
CREATE MATERIALIZED VIEW teacher_performance_metrics AS
SELECT 
  tg.teacher_id,
  t.first_name,
  t.last_name,
  t.organization_id,
  COUNT(DISTINCT tg.group_id) as group_count,
  COUNT(DISTINCT ge.student_id) as total_students,
  SUM(gra.total_invoiced) as revenue_generated,
  AVG(gra.total_collected / NULLIF(gra.total_invoiced, 0) * 100) as collection_rate
FROM teacher_groups tg
JOIN teachers t ON t.id = tg.teacher_id
LEFT JOIN group_enrollments ge ON ge.group_id = tg.group_id AND ge.status = 'active'
LEFT JOIN group_revenue_analysis gra ON gra.group_id = tg.group_id
WHERE t.deleted_at IS NULL
GROUP BY tg.teacher_id, t.first_name, t.last_name, t.organization_id;

-- Index for teacher performance
CREATE INDEX idx_teacher_performance_org ON teacher_performance_metrics(organization_id);
CREATE INDEX idx_teacher_performance_teacher ON teacher_performance_metrics(teacher_id);

-- Materialized View for Payment Method Analysis
CREATE MATERIALIZED VIEW payment_method_analysis AS
SELECT 
  p.organization_id,
  pm.name as payment_method,
  pm.type as payment_type,
  COUNT(p.id) as transaction_count,
  SUM(p.amount) as total_volume,
  SUM(p.processing_fee) as total_fees,
  AVG(p.amount) as avg_transaction,
  COUNT(DISTINCT p.student_id) as unique_students,
  DATE_TRUNC('month', p.payment_date) as month
FROM payments p
JOIN payment_methods pm ON pm.id = p.payment_method_id
WHERE p.status = 'completed' AND p.deleted_at IS NULL
GROUP BY p.organization_id, pm.name, pm.type, DATE_TRUNC('month', p.payment_date);

-- Index for payment method analysis
CREATE INDEX idx_payment_method_analysis_org ON payment_method_analysis(organization_id);
CREATE INDEX idx_payment_method_analysis_month ON payment_method_analysis(month);

-- Materialized View for Student Enrollment Trends
CREATE MATERIALIZED VIEW enrollment_trends AS
SELECT 
  organization_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_students,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_students,
  COUNT(CASE WHEN status = 'graduated' THEN 1 END) as graduated_students,
  COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped_students
FROM students
WHERE deleted_at IS NULL
GROUP BY organization_id, DATE_TRUNC('month', created_at);

-- Index for enrollment trends
CREATE INDEX idx_enrollment_trends_org ON enrollment_trends(organization_id);
CREATE INDEX idx_enrollment_trends_month ON enrollment_trends(month);

-- Function to refresh all report materialized views
CREATE OR REPLACE FUNCTION refresh_report_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY outstanding_balances;
  REFRESH MATERIALIZED VIEW CONCURRENTLY group_revenue_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY teacher_performance_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY payment_method_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY enrollment_trends;
END;
$$ LANGUAGE plpgsql;

-- Function to generate financial summary report
CREATE OR REPLACE FUNCTION generate_financial_summary(
  org_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  metric_unit text
) AS $$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      'Total Revenue' as metric_name,
      SUM(net_amount) as metric_value,
      'USD' as metric_unit
    FROM payments
    WHERE organization_id = org_id
      AND payment_date BETWEEN start_date AND end_date
      AND status = 'completed'
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Total Invoiced',
      SUM(total_amount),
      'USD'
    FROM invoices
    WHERE organization_id = org_id
      AND issue_date BETWEEN start_date AND end_date
      AND status NOT IN ('cancelled', 'draft')
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Outstanding Balance',
      SUM(total_amount - paid_amount),
      'USD'
    FROM invoices
    WHERE organization_id = org_id
      AND due_date <= end_date
      AND status IN ('sent', 'partially_paid', 'overdue')
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Collection Rate',
      AVG(CASE WHEN total_amount > 0 THEN paid_amount / total_amount * 100 ELSE 0 END),
      '%'
    FROM invoices
    WHERE organization_id = org_id
      AND issue_date BETWEEN start_date AND end_date
      AND status NOT IN ('cancelled', 'draft')
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Active Students',
      COUNT(DISTINCT student_id)::numeric,
      'students'
    FROM payments
    WHERE organization_id = org_id
      AND payment_date BETWEEN start_date AND end_date
      AND status = 'completed'
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Average Payment',
      AVG(amount),
      'USD'
    FROM payments
    WHERE organization_id = org_id
      AND payment_date BETWEEN start_date AND end_date
      AND status = 'completed'
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Total Refunds',
      SUM(refund_amount),
      'USD'
    FROM payments
    WHERE organization_id = org_id
      AND payment_date BETWEEN start_date AND end_date
      AND refund_amount > 0
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Total Discounts',
      SUM(discount_amount),
      'USD'
    FROM invoices
    WHERE organization_id = org_id
      AND issue_date BETWEEN start_date AND end_date
      AND status NOT IN ('cancelled', 'draft')
      AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
      'Total Scholarships',
      SUM(scholarship_amount),
      'USD'
    FROM invoices
    WHERE organization_id = org_id
      AND issue_date BETWEEN start_date AND end_date
      AND status NOT IN ('cancelled', 'draft')
      AND deleted_at IS NULL
  )
  SELECT * FROM metrics WHERE metric_value IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate student payment history report
CREATE OR REPLACE FUNCTION generate_student_payment_history(
  stud_id uuid,
  limit_rows integer DEFAULT 100
)
RETURNS TABLE (
  transaction_date date,
  transaction_type text,
  description text,
  amount numeric,
  balance numeric,
  reference text
) AS $$
BEGIN
  RETURN QUERY
  WITH transactions AS (
    -- Invoices
    SELECT 
      issue_date as transaction_date,
      'Invoice' as transaction_type,
      'Invoice #' || invoice_number as description,
      -total_amount as amount,
      invoice_number as reference,
      1 as sort_order
    FROM invoices
    WHERE student_id = stud_id
      AND status NOT IN ('cancelled', 'draft')
      AND deleted_at IS NULL
    
    UNION ALL
    
    -- Payments
    SELECT 
      payment_date::date,
      'Payment',
      'Payment #' || payment_number,
      amount,
      payment_number,
      2
    FROM payments
    WHERE student_id = stud_id
      AND status = 'completed'
      AND deleted_at IS NULL
    
    UNION ALL
    
    -- Refunds
    SELECT 
      refunded_at::date,
      'Refund',
      'Refund for #' || payment_number,
      -refund_amount,
      payment_number,
      3
    FROM payments
    WHERE student_id = stud_id
      AND refund_amount > 0
      AND refunded_at IS NOT NULL
      AND deleted_at IS NULL
  ),
  running_balance AS (
    SELECT 
      transaction_date,
      transaction_type,
      description,
      amount,
      reference,
      SUM(amount) OVER (ORDER BY transaction_date, sort_order) as balance
    FROM transactions
  )
  SELECT 
    transaction_date,
    transaction_type,
    description,
    amount,
    balance,
    reference
  FROM running_balance
  ORDER BY transaction_date DESC, sort_order DESC
  LIMIT limit_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to generate group financial report
CREATE OR REPLACE FUNCTION generate_group_financial_report(
  grp_id uuid
)
RETURNS TABLE (
  student_name text,
  total_invoiced numeric,
  total_paid numeric,
  outstanding numeric,
  last_payment_date date,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.first_name || ' ' || s.last_name as student_name,
    COALESCE(SUM(i.total_amount), 0) as total_invoiced,
    COALESCE(SUM(i.paid_amount), 0) as total_paid,
    COALESCE(SUM(i.total_amount - i.paid_amount), 0) as outstanding,
    MAX(p.payment_date)::date as last_payment_date,
    CASE 
      WHEN SUM(i.total_amount - i.paid_amount) = 0 THEN 'Paid'
      WHEN SUM(i.total_amount - i.paid_amount) > 0 THEN 'Outstanding'
      ELSE 'Overpaid'
    END as status
  FROM students s
  JOIN group_enrollments ge ON ge.student_id = s.id
  LEFT JOIN invoices i ON i.student_id = s.id AND i.group_id = grp_id
  LEFT JOIN payments p ON p.student_id = s.id AND p.status = 'completed'
  WHERE ge.group_id = grp_id
    AND ge.status = 'active'
    AND s.deleted_at IS NULL
  GROUP BY s.id, s.first_name, s.last_name
  ORDER BY s.last_name, s.first_name;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to refresh materialized views (if pg_cron is available)
-- This would be run by a scheduled function or external job
-- COMMENT: SELECT cron.schedule('refresh-report-views', '0 */6 * * *', 'SELECT refresh_report_views();');

-- Grant permissions for report views
GRANT SELECT ON revenue_summary TO authenticated;
GRANT SELECT ON outstanding_balances TO authenticated;
GRANT SELECT ON group_revenue_analysis TO authenticated;
GRANT SELECT ON teacher_performance_metrics TO authenticated;
GRANT SELECT ON payment_method_analysis TO authenticated;
GRANT SELECT ON enrollment_trends TO authenticated;
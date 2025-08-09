-- Harry School CRM Materialized Views Migration
-- Version: 1.0.4

-- Student enrollment statistics for dashboard
CREATE MATERIALIZED VIEW student_enrollment_stats AS
SELECT 
    organization_id,
    COUNT(*) as total_students,
    COUNT(*) FILTER (WHERE enrollment_status = 'active') as active_students,
    COUNT(*) FILTER (WHERE enrollment_status = 'inactive') as inactive_students,
    COUNT(*) FILTER (WHERE payment_status = 'overdue') as overdue_payments,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
    COUNT(*) FILTER (WHERE enrollment_status = 'graduated') as graduated_students,
    AVG(EXTRACT(YEAR FROM AGE(date_of_birth))) as avg_age
FROM students 
WHERE deleted_at IS NULL 
GROUP BY organization_id;

CREATE UNIQUE INDEX idx_student_stats_org ON student_enrollment_stats(organization_id);

-- Teacher assignment statistics
CREATE MATERIALIZED VIEW teacher_assignment_stats AS
SELECT 
    t.organization_id,
    t.id as teacher_id,
    t.full_name,
    t.employment_status,
    COUNT(tga.id) as active_groups,
    COALESCE(SUM(g.current_enrollment), 0) as total_students,
    COUNT(DISTINCT g.subject) as subjects_taught,
    AVG(g.price_per_student) as avg_group_price
FROM teachers t
LEFT JOIN teacher_group_assignments tga ON t.id = tga.teacher_id 
    AND tga.deleted_at IS NULL 
    AND tga.status = 'active'
LEFT JOIN groups g ON tga.group_id = g.id 
    AND g.deleted_at IS NULL 
    AND g.status = 'active'
WHERE t.deleted_at IS NULL
GROUP BY t.organization_id, t.id, t.full_name, t.employment_status;

CREATE UNIQUE INDEX idx_teacher_stats_teacher ON teacher_assignment_stats(teacher_id);

-- Group performance statistics
CREATE MATERIALIZED VIEW group_performance_stats AS
SELECT 
    g.organization_id,
    g.id as group_id,
    g.name,
    g.subject,
    g.status,
    g.max_students,
    g.current_enrollment,
    ROUND((g.current_enrollment::DECIMAL / g.max_students * 100), 2) as capacity_percentage,
    COUNT(sge.id) as total_enrollments,
    COUNT(sge.id) FILTER (WHERE sge.status = 'completed') as completed_enrollments,
    COUNT(sge.id) FILTER (WHERE sge.status = 'dropped') as dropped_enrollments,
    AVG(sge.attendance_rate) as avg_attendance_rate,
    COUNT(tga.id) as assigned_teachers
FROM groups g
LEFT JOIN student_group_enrollments sge ON g.id = sge.group_id AND sge.deleted_at IS NULL
LEFT JOIN teacher_group_assignments tga ON g.id = tga.group_id AND tga.deleted_at IS NULL AND tga.status = 'active'
WHERE g.deleted_at IS NULL
GROUP BY g.organization_id, g.id, g.name, g.subject, g.status, g.max_students, g.current_enrollment;

CREATE UNIQUE INDEX idx_group_stats_group ON group_performance_stats(group_id);

-- Financial overview statistics
CREATE MATERIALIZED VIEW financial_overview_stats AS
SELECT 
    organization_id,
    -- Student payments
    COUNT(DISTINCT s.id) as total_paying_students,
    SUM(s.tuition_fee) as total_expected_revenue,
    COUNT(*) FILTER (WHERE s.payment_status = 'current') as current_payments,
    COUNT(*) FILTER (WHERE s.payment_status = 'overdue') as overdue_payments,
    COUNT(*) FILTER (WHERE s.payment_status = 'partial') as partial_payments,
    
    -- Group enrollments financial
    COUNT(DISTINCT sge.id) as total_enrollments,
    SUM(sge.tuition_amount) as total_enrollment_value,
    SUM(sge.amount_paid) as total_amount_collected,
    SUM(sge.tuition_amount - sge.amount_paid) as outstanding_balance
FROM students s
LEFT JOIN student_group_enrollments sge ON s.id = sge.student_id AND sge.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY organization_id;

CREATE UNIQUE INDEX idx_financial_stats_org ON financial_overview_stats(organization_id);

-- Recent activity view for dashboard
CREATE MATERIALIZED VIEW recent_activity_summary AS
SELECT 
    organization_id,
    action,
    resource_type,
    COUNT(*) as activity_count,
    MAX(created_at) as last_occurrence,
    ARRAY_AGG(DISTINCT user_name) as users_involved
FROM activity_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY organization_id, action, resource_type
ORDER BY last_occurrence DESC;

CREATE INDEX idx_recent_activity_org ON recent_activity_summary(organization_id, last_occurrence DESC);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW student_enrollment_stats;
    REFRESH MATERIALIZED VIEW teacher_assignment_stats;
    REFRESH MATERIALIZED VIEW group_performance_stats;
    REFRESH MATERIALIZED VIEW financial_overview_stats;
    REFRESH MATERIALIZED VIEW recent_activity_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh stats for specific organization
CREATE OR REPLACE FUNCTION refresh_organization_stats(org_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Since materialized views can't be partially refreshed, we refresh all
    -- In production, consider using regular views or incremental updates
    PERFORM refresh_dashboard_stats();
END;
$$ LANGUAGE plpgsql;

-- Update schema version
INSERT INTO schema_versions (version, description) 
VALUES ('1.0.4', 'Added materialized views for dashboard performance and statistics');
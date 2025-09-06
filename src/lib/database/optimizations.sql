-- Database Performance Optimizations for Harry School CRM

-- 1. Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_students_organization_status 
ON students(organization_id, enrollment_status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_students_created_at 
ON students(created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teachers_organization_status 
ON teachers(organization_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_groups_organization_status 
ON groups(organization_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_dates 
ON student_group_enrollments(enrollment_date DESC, start_date) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_status 
ON financial_transactions(transaction_date DESC, status, organization_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_created 
ON activity_logs(created_at DESC, organization_id);

-- 2. Create composite indexes for JOIN operations
CREATE INDEX IF NOT EXISTS idx_enrollments_student_group 
ON student_group_enrollments(student_id, group_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_group 
ON teacher_group_assignments(teacher_id, group_id) 
WHERE deleted_at IS NULL;

-- 3. Create partial indexes for common WHERE clauses
CREATE INDEX IF NOT EXISTS idx_students_active 
ON students(organization_id) 
WHERE enrollment_status = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_groups_active 
ON groups(organization_id) 
WHERE status = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_pending 
ON payments(organization_id, student_id) 
WHERE status = 'pending' AND deleted_at IS NULL;
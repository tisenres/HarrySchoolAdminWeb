-- Composite Index Optimizations
-- Based on analysis of common query patterns in the Harry School CRM

-- 1. Teachers query optimization
-- Frequent pattern: filter by organization + is_active + employment_status
CREATE INDEX IF NOT EXISTS idx_teachers_org_active_employment 
ON teachers (organization_id, is_active, employment_status) 
WHERE deleted_at IS NULL;

-- 2. Students enrollment filtering optimization  
-- Frequent pattern: organization + enrollment_status + payment_status
CREATE INDEX IF NOT EXISTS idx_students_org_enrollment_payment
ON students (organization_id, enrollment_status, payment_status)
WHERE deleted_at IS NULL;

-- 3. Groups status and scheduling optimization
-- Pattern: organization + status + subject + level
CREATE INDEX IF NOT EXISTS idx_groups_org_status_subject_level
ON groups (organization_id, status, subject, level)
WHERE deleted_at IS NULL;

-- 4. Teacher-Group relationship optimization
-- For queries joining teachers and groups through group_teachers
CREATE INDEX IF NOT EXISTS idx_group_teachers_composite
ON group_teachers (teacher_id, group_id, role);

-- 5. Student-Group enrollment optimization
-- Pattern: student enrollments by group and status
CREATE INDEX IF NOT EXISTS idx_group_students_enrollment
ON group_students (group_id, student_id, enrollment_status);

-- 6. Rankings time-based queries optimization
-- Pattern: organization + entity_type + time-based sorting
CREATE INDEX IF NOT EXISTS idx_rankings_org_type_created
ON rankings (organization_id, entity_type, created_at DESC)
WHERE deleted_at IS NULL;

-- 7. Search optimization across names (GIN indexes for text search)
-- Teachers full-text search
CREATE INDEX IF NOT EXISTS idx_teachers_search_gin
ON teachers USING gin (to_tsvector('english', first_name || ' ' || last_name))
WHERE deleted_at IS NULL;

-- Students full-text search  
CREATE INDEX IF NOT EXISTS idx_students_search_gin
ON students USING gin (to_tsvector('english', first_name || ' ' || last_name))
WHERE deleted_at IS NULL;

-- 8. Soft delete pattern optimization
-- Create partial indexes excluding deleted records for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_org_active_not_deleted
ON teachers (organization_id) 
WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_students_org_active_not_deleted
ON students (organization_id)
WHERE deleted_at IS NULL AND enrollment_status IN ('active', 'enrolled');

CREATE INDEX IF NOT EXISTS idx_groups_org_active_not_deleted
ON groups (organization_id)
WHERE deleted_at IS NULL AND status = 'active';

-- 9. Statistics query optimization
-- For count queries used in dashboard statistics
CREATE INDEX IF NOT EXISTS idx_teachers_stats
ON teachers (organization_id, employment_status, is_active)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_students_stats  
ON students (organization_id, enrollment_status, payment_status)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_groups_stats
ON groups (organization_id, status, subject, level)
WHERE deleted_at IS NULL;

-- Performance Notes:
-- - Partial indexes (WHERE clauses) reduce index size and improve performance
-- - Composite index order matters: most selective columns first
-- - GIN indexes enable fast full-text search
-- - Expected improvement: 30-50% faster for filtered queries
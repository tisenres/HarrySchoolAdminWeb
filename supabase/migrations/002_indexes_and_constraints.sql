-- Harry School CRM Indexes and Constraints Migration
-- Version: 1.0.1

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(id) WHERE deleted_at IS NULL;

-- Profiles indexes
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(organization_id, id) WHERE deleted_at IS NULL;

-- Teachers indexes
CREATE INDEX idx_teachers_organization ON teachers(organization_id);
CREATE INDEX idx_teachers_full_name ON teachers USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_teachers_phone ON teachers(phone);
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);
CREATE INDEX idx_teachers_active ON teachers(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_teachers_specializations ON teachers USING gin(specializations);

-- Students indexes
CREATE INDEX idx_students_organization ON students(organization_id);
CREATE INDEX idx_students_full_name ON students USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_students_primary_phone ON students(primary_phone);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_enrollment_status ON students(enrollment_status);
CREATE INDEX idx_students_active ON students(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_students_payment_status ON students(payment_status);

-- Groups indexes
CREATE INDEX idx_groups_organization ON groups(organization_id);
CREATE INDEX idx_groups_name ON groups USING gin(to_tsvector('english', name));
CREATE INDEX idx_groups_subject ON groups(subject);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_active ON groups(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_groups_schedule ON groups USING gin(schedule);

-- Teacher assignments indexes
CREATE INDEX idx_teacher_assignments_teacher ON teacher_group_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_group ON teacher_group_assignments(group_id);
CREATE INDEX idx_teacher_assignments_organization ON teacher_group_assignments(organization_id);
CREATE INDEX idx_teacher_assignments_active ON teacher_group_assignments(teacher_id, group_id) WHERE deleted_at IS NULL AND status = 'active';

-- Student enrollments indexes
CREATE INDEX idx_student_enrollments_student ON student_group_enrollments(student_id);
CREATE INDEX idx_student_enrollments_group ON student_group_enrollments(group_id);
CREATE INDEX idx_student_enrollments_organization ON student_group_enrollments(organization_id);
CREATE INDEX idx_student_enrollments_status ON student_group_enrollments(status);
CREATE INDEX idx_student_enrollments_payment ON student_group_enrollments(payment_status);
CREATE INDEX idx_student_enrollments_active ON student_group_enrollments(student_id, group_id) WHERE deleted_at IS NULL AND status IN ('enrolled', 'active');

-- Notifications indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_organization ON notifications(organization_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Activity logs indexes
CREATE INDEX idx_activity_logs_organization ON activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action, created_at DESC);

-- System settings indexes
CREATE INDEX idx_system_settings_organization ON system_settings(organization_id);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;

-- Full-text search indexes
CREATE INDEX idx_students_search ON students USING gin(
    to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(primary_phone, '') || ' ' || coalesce(email, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX idx_teachers_search ON teachers USING gin(
    to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX idx_groups_search ON groups USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(description, ''))
) WHERE deleted_at IS NULL;

-- Data validation constraints
ALTER TABLE students ADD CONSTRAINT check_phone_format 
CHECK (primary_phone ~ '^\+998[0-9]{9}$' OR primary_phone IS NULL);

ALTER TABLE teachers ADD CONSTRAINT check_phone_format 
CHECK (phone ~ '^\+998[0-9]{9}$');

ALTER TABLE students ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE teachers ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE students ADD CONSTRAINT check_enrollment_date 
CHECK (enrollment_date <= CURRENT_DATE);

ALTER TABLE teachers ADD CONSTRAINT check_hire_date 
CHECK (hire_date <= CURRENT_DATE);

ALTER TABLE groups ADD CONSTRAINT check_group_capacity 
CHECK (max_students > 0 AND max_students <= 100);

-- Update schema version
INSERT INTO schema_versions (version, description) 
VALUES ('1.0.1', 'Added indexes and data validation constraints');
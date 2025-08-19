# Database Schema - Harry School CRM

## Schema Overview

The Harry School CRM database is designed as a multi-tenant system built on PostgreSQL through Supabase. The schema supports comprehensive educational management with full audit trails, soft deletes, and real-time capabilities.

### Core Design Principles

1. **Multi-tenant Architecture**: All data is organization-scoped for complete isolation
2. **Audit Trail**: Complete tracking of all data changes with user attribution
3. **Soft Delete System**: Recoverable deletion with archive management
4. **Performance Optimization**: Indexed for <200ms search responses
5. **Real-time Capability**: Optimized for live updates and notifications

## Core Tables

### 1. organizations

Multi-tenant foundation table for complete data isolation.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-safe identifier
    logo_url TEXT,
    address JSONB, -- Flexible address structure
    contact_info JSONB, -- Phone, email, website
    settings JSONB DEFAULT '{}'::jsonb, -- Organization preferences
    subscription_plan TEXT DEFAULT 'basic',
    subscription_status TEXT DEFAULT 'active',
    max_students INTEGER DEFAULT 500,
    max_teachers INTEGER DEFAULT 50,
    max_groups INTEGER DEFAULT 50,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(id) WHERE deleted_at IS NULL;
```

### 2. profiles

Extended user profiles linking to Supabase auth.users with role-based access.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'viewer')),
    
    -- Profile settings
    language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'ru', 'uz')),
    timezone TEXT DEFAULT 'Asia/Tashkent',
    notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "system_notifications": true,
        "student_updates": true,
        "payment_reminders": true
    }'::jsonb,
    
    -- Activity tracking
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    UNIQUE(email, organization_id)
);

-- Indexes
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(organization_id, id) WHERE deleted_at IS NULL;
```

### 3. teachers

Comprehensive teacher management with specializations and assignments.

```sql
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email TEXT,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    
    -- Professional Information
    employee_id TEXT, -- Internal employee identifier
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
    contract_type TEXT CHECK (contract_type IN ('full_time', 'part_time', 'contract', 'substitute')),
    salary_amount DECIMAL(10,2),
    salary_currency TEXT DEFAULT 'UZS',
    
    -- Education & Qualifications
    qualifications JSONB DEFAULT '[]'::jsonb, -- Array of qualification objects
    specializations TEXT[] DEFAULT '{}', -- Array of subject specializations
    certifications JSONB DEFAULT '[]'::jsonb, -- Array of certification objects
    languages_spoken TEXT[] DEFAULT '{}', -- Array of language codes
    
    -- Contact & Personal
    address JSONB, -- Structured address
    emergency_contact JSONB, -- Emergency contact information
    documents JSONB DEFAULT '[]'::jsonb, -- Array of document references
    notes TEXT,
    
    -- System fields
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    UNIQUE(employee_id, organization_id),
    UNIQUE(email, organization_id) WHERE email IS NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_teachers_organization ON teachers(organization_id);
CREATE INDEX idx_teachers_full_name ON teachers USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_teachers_phone ON teachers(phone);
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);
CREATE INDEX idx_teachers_active ON teachers(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_teachers_specializations ON teachers USING gin(specializations);
```

### 4. students

Comprehensive student management with enrollment tracking and family information.

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    nationality TEXT,
    
    -- Student-specific Information
    student_id TEXT, -- Internal student identifier
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    enrollment_status TEXT DEFAULT 'active' CHECK (enrollment_status IN ('active', 'inactive', 'graduated', 'transferred', 'expelled', 'on_hold')),
    grade_level TEXT,
    
    -- Contact Information
    primary_phone TEXT,
    secondary_phone TEXT,
    email TEXT,
    address JSONB, -- Structured address
    
    -- Family Information
    parent_guardian_info JSONB DEFAULT '[]'::jsonb, -- Array of parent/guardian objects
    emergency_contacts JSONB DEFAULT '[]'::jsonb, -- Array of emergency contact objects
    family_notes TEXT,
    
    -- Academic Information
    previous_education JSONB, -- Previous school/education history
    special_needs TEXT,
    medical_notes TEXT,
    allergies TEXT,
    
    -- Financial Information
    payment_plan TEXT CHECK (payment_plan IN ('monthly', 'quarterly', 'annual', 'custom')),
    tuition_fee DECIMAL(10,2),
    currency TEXT DEFAULT 'UZS',
    payment_status TEXT DEFAULT 'current' CHECK (payment_status IN ('current', 'overdue', 'paid_ahead', 'partial', 'suspended')),
    
    -- System fields
    profile_image_url TEXT,
    documents JSONB DEFAULT '[]'::jsonb, -- Array of document references
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    UNIQUE(student_id, organization_id),
    UNIQUE(email, organization_id) WHERE email IS NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_students_organization ON students(organization_id);
CREATE INDEX idx_students_full_name ON students USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_students_primary_phone ON students(primary_phone);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_enrollment_status ON students(enrollment_status);
CREATE INDEX idx_students_active ON students(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_students_payment_status ON students(payment_status);
```

### 5. groups

Learning class management with scheduling and capacity tracking.

```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    name TEXT NOT NULL,
    description TEXT,
    group_code TEXT, -- Internal group identifier
    
    -- Academic Information
    subject TEXT NOT NULL,
    level TEXT, -- Beginner, Intermediate, Advanced, etc.
    curriculum JSONB, -- Curriculum details and progress
    
    -- Scheduling
    schedule JSONB NOT NULL, -- Flexible schedule structure
    start_date DATE NOT NULL,
    end_date DATE,
    duration_weeks INTEGER,
    
    -- Capacity Management
    max_students INTEGER NOT NULL DEFAULT 15,
    current_enrollment INTEGER DEFAULT 0,
    waiting_list_count INTEGER DEFAULT 0,
    
    -- Status and Settings
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled', 'on_hold')),
    group_type TEXT CHECK (group_type IN ('regular', 'intensive', 'private', 'online', 'hybrid')),
    
    -- Financial Information
    price_per_student DECIMAL(10,2),
    currency TEXT DEFAULT 'UZS',
    payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'per_session', 'full_course')),
    
    -- Location and Resources
    classroom TEXT,
    online_meeting_url TEXT,
    required_materials JSONB DEFAULT '[]'::jsonb,
    
    -- System fields
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    UNIQUE(group_code, organization_id)
);

-- Indexes
CREATE INDEX idx_groups_organization ON groups(organization_id);
CREATE INDEX idx_groups_name ON groups USING gin(to_tsvector('english', name));
CREATE INDEX idx_groups_subject ON groups(subject);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_active ON groups(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_groups_schedule ON groups USING gin(schedule);
```

## Relationship Tables

### 6. teacher_group_assignments

Many-to-many relationship between teachers and groups with role tracking.

```sql
CREATE TABLE teacher_group_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Assignment Details
    role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'assistant', 'substitute', 'observer')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Compensation (if applicable)
    compensation_rate DECIMAL(10,2),
    compensation_type TEXT CHECK (compensation_type IN ('per_hour', 'per_session', 'per_student', 'fixed')),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    UNIQUE(teacher_id, group_id, organization_id, start_date)
);

-- Indexes
CREATE INDEX idx_teacher_assignments_teacher ON teacher_group_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_group ON teacher_group_assignments(group_id);
CREATE INDEX idx_teacher_assignments_organization ON teacher_group_assignments(organization_id);
CREATE INDEX idx_teacher_assignments_active ON teacher_group_assignments(teacher_id, group_id) WHERE deleted_at IS NULL AND status = 'active';
```

### 7. student_group_enrollments

Many-to-many relationship tracking student enrollment history.

```sql
CREATE TABLE student_group_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Enrollment Details
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL,
    end_date DATE,
    completion_date DATE,
    
    -- Status Tracking
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'completed', 'dropped', 'transferred', 'on_hold')),
    attendance_rate DECIMAL(5,2), -- Percentage
    progress_notes TEXT,
    
    -- Financial Tracking
    tuition_amount DECIMAL(10,2),
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
    
    -- Academic Performance
    final_grade TEXT,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_number TEXT,
    
    -- System fields
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    UNIQUE(student_id, group_id, enrollment_date, organization_id)
);

-- Indexes
CREATE INDEX idx_student_enrollments_student ON student_group_enrollments(student_id);
CREATE INDEX idx_student_enrollments_group ON student_group_enrollments(group_id);
CREATE INDEX idx_student_enrollments_organization ON student_group_enrollments(organization_id);
CREATE INDEX idx_student_enrollments_status ON student_group_enrollments(status);
CREATE INDEX idx_student_enrollments_payment ON student_group_enrollments(payment_status);
CREATE INDEX idx_student_enrollments_active ON student_group_enrollments(student_id, group_id) WHERE deleted_at IS NULL AND status IN ('enrolled', 'active');
```

## System Tables

### 8. notifications

Real-time notification system for system events and alerts.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Recipient Information
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system-wide notifications
    role_target TEXT[], -- Target specific roles if user_id is NULL
    
    -- Notification Content
    type TEXT NOT NULL CHECK (type IN ('system', 'enrollment', 'payment', 'schedule', 'achievement', 'reminder', 'alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- Deep link to relevant page
    
    -- Related Entities (for context)
    related_student_id UUID REFERENCES students(id),
    related_teacher_id UUID REFERENCES teachers(id),
    related_group_id UUID REFERENCES groups(id),
    
    -- Delivery Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    delivery_method TEXT[] DEFAULT '{"in_app"}' CHECK (delivery_method && ARRAY['in_app', 'email', 'sms']),
    
    -- Priority and Scheduling
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    scheduled_for TIMESTAMPTZ, -- For scheduled notifications
    expires_at TIMESTAMPTZ, -- Auto-cleanup date
    
    -- System fields
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional context data
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Indexes for real-time performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_organization ON notifications(organization_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;
```

### 9. activity_logs

Comprehensive audit trail for all system activities.

```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Actor Information
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    
    -- Action Information
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.
    resource_type TEXT NOT NULL, -- student, teacher, group, etc.
    resource_id UUID,
    resource_name TEXT,
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_activity_logs_organization ON activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action, created_at DESC);
```

### 10. system_settings

Global and organization-specific system configuration.

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for global settings
    
    -- Setting Details
    category TEXT NOT NULL, -- 'global', 'notifications', 'academic', 'financial', etc.
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    
    -- Metadata
    data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- Can be accessed by non-admin users
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, category, key)
);

-- Indexes
CREATE INDEX idx_system_settings_organization ON system_settings(organization_id);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;
```

## Performance Optimization

### Full-Text Search Configuration

```sql
-- Create search configurations for multilingual support
CREATE TEXT SEARCH CONFIGURATION uzbek (COPY = english);
CREATE TEXT SEARCH CONFIGURATION russian (COPY = russian);

-- Search indexes for fast name/phone lookups
CREATE INDEX idx_students_search ON students USING gin(
    to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(primary_phone, '') || ' ' || coalesce(email, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX idx_teachers_search ON teachers USING gin(
    to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX idx_groups_search ON groups USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(description, ''))
) WHERE deleted_at IS NULL;
```

### Materialized Views for Dashboard Performance

```sql
-- Student enrollment statistics
CREATE MATERIALIZED VIEW student_enrollment_stats AS
SELECT 
    organization_id,
    COUNT(*) as total_students,
    COUNT(*) FILTER (WHERE enrollment_status = 'active') as active_students,
    COUNT(*) FILTER (WHERE enrollment_status = 'inactive') as inactive_students,
    COUNT(*) FILTER (WHERE payment_status = 'overdue') as overdue_payments,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
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
    COUNT(tga.id) as active_groups,
    SUM(g.current_enrollment) as total_students
FROM teachers t
LEFT JOIN teacher_group_assignments tga ON t.id = tga.teacher_id AND tga.deleted_at IS NULL AND tga.status = 'active'
LEFT JOIN groups g ON tga.group_id = g.id AND g.deleted_at IS NULL
WHERE t.deleted_at IS NULL AND t.is_active = true
GROUP BY t.organization_id, t.id, t.full_name;

CREATE UNIQUE INDEX idx_teacher_stats_teacher ON teacher_assignment_stats(teacher_id);
```

## Database Functions

### Automatic Enrollment Count Updates

```sql
-- Function to update group enrollment counts
CREATE OR REPLACE FUNCTION update_group_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current_enrollment count for the affected group
    UPDATE groups 
    SET current_enrollment = (
        SELECT COUNT(*)
        FROM student_group_enrollments
        WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
        AND deleted_at IS NULL
        AND status IN ('enrolled', 'active')
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update enrollment counts
CREATE TRIGGER trigger_update_group_enrollment
    AFTER INSERT OR UPDATE OR DELETE ON student_group_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_group_enrollment_count();
```

### Soft Delete Automation

```sql
-- Function to handle soft deletes with cascade
CREATE OR REPLACE FUNCTION soft_delete_cascade()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark related records as deleted when parent is soft deleted
    CASE TG_TABLE_NAME
        WHEN 'teachers' THEN
            UPDATE teacher_group_assignments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE teacher_id = NEW.id AND deleted_at IS NULL;
            
        WHEN 'students' THEN
            UPDATE student_group_enrollments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE student_id = NEW.id AND deleted_at IS NULL;
            
        WHEN 'groups' THEN
            UPDATE teacher_group_assignments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE group_id = NEW.id AND deleted_at IS NULL;
            
            UPDATE student_group_enrollments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE group_id = NEW.id AND deleted_at IS NULL;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for soft delete cascade
CREATE TRIGGER trigger_soft_delete_teachers
    AFTER UPDATE OF deleted_at ON teachers
    FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_cascade();

CREATE TRIGGER trigger_soft_delete_students
    AFTER UPDATE OF deleted_at ON students
    FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_cascade();

CREATE TRIGGER trigger_soft_delete_groups
    AFTER UPDATE OF deleted_at ON groups
    FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_cascade();
```

## Data Validation

### Check Constraints

```sql
-- Phone number format validation (Uzbekistan format)
ALTER TABLE students ADD CONSTRAINT check_phone_format 
CHECK (primary_phone ~ '^\+998[0-9]{9}$' OR primary_phone IS NULL);

ALTER TABLE teachers ADD CONSTRAINT check_phone_format 
CHECK (phone ~ '^\+998[0-9]{9}$');

-- Email format validation
ALTER TABLE students ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE teachers ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

-- Date validation
ALTER TABLE students ADD CONSTRAINT check_enrollment_date 
CHECK (enrollment_date <= CURRENT_DATE);

ALTER TABLE teachers ADD CONSTRAINT check_hire_date 
CHECK (hire_date <= CURRENT_DATE);

-- Capacity validation for groups
ALTER TABLE groups ADD CONSTRAINT check_group_capacity 
CHECK (max_students > 0 AND max_students <= 100);
```

## Schema Version and Migration Support

```sql
-- Schema version tracking
CREATE TABLE schema_versions (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by UUID REFERENCES auth.users(id)
);

-- Insert initial version
INSERT INTO schema_versions (version, description) 
VALUES ('1.0.0', 'Initial Harry School CRM schema');
```

This comprehensive database schema provides:

1. **Complete multi-tenant support** with organization-based isolation
2. **Full audit trails** with user attribution for all changes
3. **Soft delete system** with cascade relationships
4. **Performance optimization** with strategic indexing and materialized views
5. **Real-time capabilities** with notification system
6. **Data integrity** with comprehensive constraints and validation
7. **Scalability** designed for 1000+ students with <200ms search performance
8. **Flexibility** with JSONB fields for extensible data structures

The schema supports all requirements identified in the UX research and provides a solid foundation for the Next.js application with Supabase.
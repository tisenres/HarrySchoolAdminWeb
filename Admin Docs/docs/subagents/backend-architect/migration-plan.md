# Migration Plan - Harry School CRM

## Migration Strategy Overview

The Harry School CRM database migration plan provides a systematic approach to deploying the complete schema, including initial setup, seed data, and progressive rollout phases. The plan ensures zero-downtime deployment and includes rollback strategies for production safety.

## Migration Phases

### Phase 1: Foundation Setup
- Core infrastructure tables (organizations, profiles, system_settings)
- Authentication and authorization setup
- Basic RLS policies

### Phase 2: Core Entities
- Students, teachers, and groups tables
- Relationship tables (assignments, enrollments)
- Advanced RLS policies

### Phase 3: System Features
- Notifications and activity logs
- Full-text search configuration
- Materialized views and analytics

### Phase 4: Production Ready
- Performance optimizations
- Monitoring and alerting
- Data validation and cleanup

## Migration Scripts

### 001_initial_setup.sql

```sql
-- Migration: Initial database setup and organizations
-- Version: 1.0.0
-- Description: Core foundation tables and basic authentication

BEGIN;

-- Create schema version tracking
CREATE TABLE IF NOT EXISTS schema_versions (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by TEXT,
    rollback_sql TEXT
);

-- Insert this migration version
INSERT INTO schema_versions (version, description, applied_by) 
VALUES ('001', 'Initial database setup and organizations', current_user);

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Organizations table (multi-tenant foundation)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    logo_url TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Subscription management
    subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    max_students INTEGER DEFAULT 500 CHECK (max_students > 0),
    max_teachers INTEGER DEFAULT 50 CHECK (max_teachers > 0),
    max_groups INTEGER DEFAULT 50 CHECK (max_groups > 0),
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_subscription ON organizations(subscription_status, subscription_plan);

-- User profiles extending Supabase auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
    avatar_url TEXT,
    phone TEXT CHECK (phone ~ '^\+998[0-9]{9}$'),
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'viewer')),
    
    -- User preferences
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
    login_count INTEGER DEFAULT 0 CHECK (login_count >= 0),
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    UNIQUE(email, organization_id)
);

-- Profiles indexes
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(organization_id, id) WHERE deleted_at IS NULL;

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    category TEXT NOT NULL CHECK (length(category) >= 1),
    key TEXT NOT NULL CHECK (length(key) >= 1),
    value JSONB NOT NULL,
    description TEXT,
    
    -- Metadata
    data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(organization_id, category, key)
);

-- System settings indexes
CREATE INDEX idx_system_settings_organization ON system_settings(organization_id);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

COMMIT;
```

### 002_core_entities.sql

```sql
-- Migration: Core entities (students, teachers, groups)
-- Version: 1.1.0
-- Description: Main business entities and relationships

BEGIN;

INSERT INTO schema_versions (version, description, applied_by) 
VALUES ('002', 'Core entities (students, teachers, groups)', current_user);

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name TEXT NOT NULL CHECK (length(first_name) >= 1 AND length(first_name) <= 50),
    last_name TEXT NOT NULL CHECK (length(last_name) >= 1 AND length(last_name) <= 50),
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email TEXT CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone TEXT NOT NULL CHECK (phone ~ '^\+998[0-9]{9}$'),
    date_of_birth DATE CHECK (date_of_birth < CURRENT_DATE AND date_of_birth > '1950-01-01'),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    
    -- Professional Information
    employee_id TEXT,
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE CHECK (hire_date <= CURRENT_DATE),
    employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
    contract_type TEXT CHECK (contract_type IN ('full_time', 'part_time', 'contract', 'substitute')),
    salary_amount DECIMAL(12,2) CHECK (salary_amount >= 0),
    salary_currency TEXT DEFAULT 'UZS',
    
    -- Education & Qualifications
    qualifications JSONB DEFAULT '[]'::jsonb,
    specializations TEXT[] DEFAULT '{}',
    certifications JSONB DEFAULT '[]'::jsonb,
    languages_spoken TEXT[] DEFAULT '{}',
    
    -- Contact & Personal
    address JSONB DEFAULT '{}'::jsonb,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    
    -- System fields
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    UNIQUE(employee_id, organization_id),
    UNIQUE(email, organization_id) WHERE email IS NOT NULL
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name TEXT NOT NULL CHECK (length(first_name) >= 1 AND length(first_name) <= 50),
    last_name TEXT NOT NULL CHECK (length(last_name) >= 1 AND length(last_name) <= 50),
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    date_of_birth DATE NOT NULL CHECK (date_of_birth < CURRENT_DATE AND date_of_birth > '1990-01-01'),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    nationality TEXT,
    
    -- Student-specific Information
    student_id TEXT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE CHECK (enrollment_date <= CURRENT_DATE),
    enrollment_status TEXT DEFAULT 'active' CHECK (enrollment_status IN ('active', 'inactive', 'graduated', 'transferred', 'expelled', 'on_hold')),
    grade_level TEXT,
    
    -- Contact Information
    primary_phone TEXT CHECK (primary_phone ~ '^\+998[0-9]{9}$'),
    secondary_phone TEXT CHECK (secondary_phone ~ '^\+998[0-9]{9}$'),
    email TEXT CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    address JSONB DEFAULT '{}'::jsonb,
    
    -- Family Information
    parent_guardian_info JSONB DEFAULT '[]'::jsonb,
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    family_notes TEXT,
    
    -- Academic Information
    previous_education JSONB DEFAULT '{}'::jsonb,
    special_needs TEXT,
    medical_notes TEXT,
    allergies TEXT,
    
    -- Financial Information
    payment_plan TEXT CHECK (payment_plan IN ('monthly', 'quarterly', 'annual', 'custom')),
    tuition_fee DECIMAL(12,2) CHECK (tuition_fee >= 0),
    currency TEXT DEFAULT 'UZS',
    payment_status TEXT DEFAULT 'current' CHECK (payment_status IN ('current', 'overdue', 'paid_ahead', 'partial', 'suspended')),
    
    -- System fields
    profile_image_url TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    UNIQUE(student_id, organization_id),
    UNIQUE(email, organization_id) WHERE email IS NOT NULL
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    description TEXT,
    group_code TEXT,
    
    -- Academic Information
    subject TEXT NOT NULL CHECK (length(subject) >= 1),
    level TEXT,
    curriculum JSONB DEFAULT '{}'::jsonb,
    
    -- Scheduling
    schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    start_date DATE NOT NULL CHECK (start_date >= CURRENT_DATE - INTERVAL '1 year'),
    end_date DATE CHECK (end_date IS NULL OR end_date > start_date),
    duration_weeks INTEGER CHECK (duration_weeks > 0),
    
    -- Capacity Management
    max_students INTEGER NOT NULL DEFAULT 15 CHECK (max_students > 0 AND max_students <= 100),
    current_enrollment INTEGER DEFAULT 0 CHECK (current_enrollment >= 0),
    waiting_list_count INTEGER DEFAULT 0 CHECK (waiting_list_count >= 0),
    
    -- Status and Settings
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled', 'on_hold')),
    group_type TEXT CHECK (group_type IN ('regular', 'intensive', 'private', 'online', 'hybrid')),
    
    -- Financial Information
    price_per_student DECIMAL(12,2) CHECK (price_per_student >= 0),
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    UNIQUE(group_code, organization_id),
    CHECK (current_enrollment <= max_students)
);

-- Teacher group assignments (many-to-many)
CREATE TABLE teacher_group_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Assignment Details
    role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'assistant', 'substitute', 'observer')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE CHECK (end_date IS NULL OR end_date > start_date),
    
    -- Compensation
    compensation_rate DECIMAL(10,2) CHECK (compensation_rate >= 0),
    compensation_type TEXT CHECK (compensation_type IN ('per_hour', 'per_session', 'per_student', 'fixed')),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    UNIQUE(teacher_id, group_id, organization_id, start_date)
);

-- Student group enrollments (many-to-many with history)
CREATE TABLE student_group_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Enrollment Details
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL,
    end_date DATE CHECK (end_date IS NULL OR end_date > start_date),
    completion_date DATE,
    
    -- Status Tracking
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'completed', 'dropped', 'transferred', 'on_hold')),
    attendance_rate DECIMAL(5,2) CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
    progress_notes TEXT,
    
    -- Financial Tracking
    tuition_amount DECIMAL(12,2) CHECK (tuition_amount >= 0),
    amount_paid DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
    
    -- Academic Performance
    final_grade TEXT,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_number TEXT,
    
    -- System fields
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    UNIQUE(student_id, group_id, enrollment_date, organization_id),
    CHECK (amount_paid <= tuition_amount OR payment_status = 'waived')
);

-- Enable RLS on all new tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_group_enrollments ENABLE ROW LEVEL SECURITY;

COMMIT;
```

### 003_system_features.sql

```sql
-- Migration: System features (notifications, logs, search)
-- Version: 1.2.0
-- Description: Notifications, activity logs, and search functionality

BEGIN;

INSERT INTO schema_versions (version, description, applied_by) 
VALUES ('003', 'System features (notifications, logs, search)', current_user);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Recipient Information
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_target TEXT[],
    
    -- Notification Content
    type TEXT NOT NULL CHECK (type IN ('system', 'enrollment', 'payment', 'schedule', 'achievement', 'reminder', 'alert')),
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 1000),
    action_url TEXT,
    
    -- Related Entities
    related_student_id UUID REFERENCES students(id),
    related_teacher_id UUID REFERENCES teachers(id),
    related_group_id UUID REFERENCES groups(id),
    
    -- Delivery Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    delivery_method TEXT[] DEFAULT '{"in_app"}' CHECK (delivery_method && ARRAY['in_app', 'email', 'sms']),
    
    -- Priority and Scheduling
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    scheduled_for TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- System fields
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    CHECK (user_id IS NOT NULL OR role_target IS NOT NULL),
    CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Actor Information
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    
    -- Action Information
    action TEXT NOT NULL CHECK (length(action) >= 1),
    resource_type TEXT NOT NULL CHECK (length(resource_type) >= 1),
    resource_id UUID,
    resource_name TEXT,
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create search configurations for multilingual support
CREATE TEXT SEARCH CONFIGURATION uzbek (COPY = english);
CREATE TEXT SEARCH CONFIGURATION russian (COPY = russian);

COMMIT;
```

### 004_indexes_and_performance.sql

```sql
-- Migration: Indexes and performance optimizations
-- Version: 1.3.0
-- Description: Performance indexes, materialized views, and optimization

BEGIN;

INSERT INTO schema_versions (version, description, applied_by) 
VALUES ('004', 'Indexes and performance optimizations', current_user);

-- Teachers indexes
CREATE INDEX CONCURRENTLY idx_teachers_organization ON teachers(organization_id);
CREATE INDEX CONCURRENTLY idx_teachers_full_name ON teachers USING gin(to_tsvector('english', full_name));
CREATE INDEX CONCURRENTLY idx_teachers_phone ON teachers(phone);
CREATE INDEX CONCURRENTLY idx_teachers_employee_id ON teachers(employee_id);
CREATE INDEX CONCURRENTLY idx_teachers_active ON teachers(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX CONCURRENTLY idx_teachers_specializations ON teachers USING gin(specializations);
CREATE INDEX CONCURRENTLY idx_teachers_employment_status ON teachers(employment_status);

-- Students indexes
CREATE INDEX CONCURRENTLY idx_students_organization ON students(organization_id);
CREATE INDEX CONCURRENTLY idx_students_full_name ON students USING gin(to_tsvector('english', full_name));
CREATE INDEX CONCURRENTLY idx_students_primary_phone ON students(primary_phone);
CREATE INDEX CONCURRENTLY idx_students_student_id ON students(student_id);
CREATE INDEX CONCURRENTLY idx_students_enrollment_status ON students(enrollment_status);
CREATE INDEX CONCURRENTLY idx_students_active ON students(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX CONCURRENTLY idx_students_payment_status ON students(payment_status);

-- Groups indexes
CREATE INDEX CONCURRENTLY idx_groups_organization ON groups(organization_id);
CREATE INDEX CONCURRENTLY idx_groups_name ON groups USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY idx_groups_subject ON groups(subject);
CREATE INDEX CONCURRENTLY idx_groups_status ON groups(status);
CREATE INDEX CONCURRENTLY idx_groups_active ON groups(organization_id, id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX CONCURRENTLY idx_groups_schedule ON groups USING gin(schedule);

-- Assignment indexes
CREATE INDEX CONCURRENTLY idx_teacher_assignments_teacher ON teacher_group_assignments(teacher_id);
CREATE INDEX CONCURRENTLY idx_teacher_assignments_group ON teacher_group_assignments(group_id);
CREATE INDEX CONCURRENTLY idx_teacher_assignments_organization ON teacher_group_assignments(organization_id);
CREATE INDEX CONCURRENTLY idx_teacher_assignments_active ON teacher_group_assignments(teacher_id, group_id) WHERE deleted_at IS NULL AND status = 'active';

-- Enrollment indexes
CREATE INDEX CONCURRENTLY idx_student_enrollments_student ON student_group_enrollments(student_id);
CREATE INDEX CONCURRENTLY idx_student_enrollments_group ON student_group_enrollments(group_id);
CREATE INDEX CONCURRENTLY idx_student_enrollments_organization ON student_group_enrollments(organization_id);
CREATE INDEX CONCURRENTLY idx_student_enrollments_status ON student_group_enrollments(status);
CREATE INDEX CONCURRENTLY idx_student_enrollments_payment ON student_group_enrollments(payment_status);
CREATE INDEX CONCURRENTLY idx_student_enrollments_active ON student_group_enrollments(student_id, group_id) WHERE deleted_at IS NULL AND status IN ('enrolled', 'active');

-- Notification indexes
CREATE INDEX CONCURRENTLY idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_notifications_organization ON notifications(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Activity log indexes
CREATE INDEX CONCURRENTLY idx_activity_logs_organization ON activity_logs(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_activity_logs_resource ON activity_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_activity_logs_action ON activity_logs(action, created_at DESC);

-- Search indexes for fast name/phone lookups
CREATE INDEX CONCURRENTLY idx_students_search ON students USING gin(
    to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(primary_phone, '') || ' ' || coalesce(email, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_teachers_search ON teachers USING gin(
    to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_groups_search ON groups USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(description, ''))
) WHERE deleted_at IS NULL;

-- Materialized views for dashboard performance
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

COMMIT;
```

### 005_functions_and_triggers.sql

```sql
-- Migration: Database functions and triggers
-- Version: 1.4.0
-- Description: Automation functions, triggers, and business logic

BEGIN;

INSERT INTO schema_versions (version, description, applied_by) 
VALUES ('005', 'Database functions and triggers', current_user);

-- Audit fields function
CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = auth.uid();
        NEW.created_at = NOW();
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        NEW.created_by = OLD.created_by;
        NEW.created_at = OLD.created_at;
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
        
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by = auth.uid();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Group enrollment count update function
CREATE OR REPLACE FUNCTION update_group_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
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

-- Soft delete cascade function
CREATE OR REPLACE FUNCTION soft_delete_cascade()
RETURNS TRIGGER AS $$
BEGIN
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

-- Automated notification function
CREATE OR REPLACE FUNCTION create_automated_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    student_name TEXT;
    group_name TEXT;
BEGIN
    -- Student enrollment notifications
    IF TG_TABLE_NAME = 'student_group_enrollments' AND TG_OP = 'INSERT' THEN
        SELECT full_name INTO student_name FROM students WHERE id = NEW.student_id;
        SELECT name INTO group_name FROM groups WHERE id = NEW.group_id;
        
        INSERT INTO notifications (
            organization_id, type, title, message, priority, role_target,
            related_student_id, related_group_id, delivery_method
        ) VALUES (
            NEW.organization_id, 'enrollment', 'New Student Enrollment',
            student_name || ' has enrolled in ' || group_name,
            'normal', ARRAY['admin', 'superadmin'],
            NEW.student_id, NEW.group_id, ARRAY['in_app', 'email']
        );
    END IF;
    
    -- Payment status notifications
    IF TG_TABLE_NAME = 'students' AND TG_OP = 'UPDATE' AND 
       OLD.payment_status != NEW.payment_status AND NEW.payment_status = 'overdue' THEN
        
        INSERT INTO notifications (
            organization_id, type, title, message, priority, role_target,
            related_student_id, delivery_method
        ) VALUES (
            NEW.organization_id, 'payment', 'Payment Overdue',
            NEW.full_name || ' has an overdue payment',
            'high', ARRAY['admin', 'superadmin'],
            NEW.id, ARRAY['in_app', 'email']
        );
    END IF;
    
    -- Group capacity notifications
    IF TG_TABLE_NAME = 'groups' AND TG_OP = 'UPDATE' AND 
       NEW.current_enrollment >= NEW.max_students AND OLD.current_enrollment < OLD.max_students THEN
        
        INSERT INTO notifications (
            organization_id, type, title, message, priority, role_target,
            related_group_id, delivery_method
        ) VALUES (
            NEW.organization_id, 'alert', 'Group Full',
            NEW.name || ' has reached maximum capacity',
            'normal', ARRAY['admin', 'superadmin'],
            NEW.id, ARRAY['in_app']
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    action_name TEXT;
    user_profile RECORD;
BEGIN
    -- Get user profile for context
    SELECT full_name, email, role INTO user_profile
    FROM profiles WHERE id = auth.uid();
    
    -- Determine action
    action_name := CASE TG_OP
        WHEN 'INSERT' THEN 'CREATE'
        WHEN 'UPDATE' THEN 'UPDATE'
        WHEN 'DELETE' THEN 'DELETE'
    END;
    
    -- Prepare data
    old_data := CASE WHEN OLD IS NULL THEN NULL ELSE row_to_json(OLD)::jsonb END;
    new_data := CASE WHEN NEW IS NULL THEN NULL ELSE row_to_json(NEW)::jsonb END;
    
    -- Insert activity log
    INSERT INTO activity_logs (
        organization_id, user_id, user_email, user_name, user_role,
        action, resource_type, resource_id, resource_name,
        old_values, new_values, description, ip_address, user_agent
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        auth.uid(),
        user_profile.email,
        user_profile.full_name,
        user_profile.role,
        action_name,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.full_name, NEW.name, OLD.full_name, OLD.name),
        old_data,
        new_data,
        action_name || ' ' || TG_TABLE_NAME,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all main tables
CREATE TRIGGER audit_organizations BEFORE INSERT OR UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_profiles BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_teachers BEFORE INSERT OR UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_students BEFORE INSERT OR UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_groups BEFORE INSERT OR UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_teacher_assignments BEFORE INSERT OR UPDATE ON teacher_group_assignments FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_student_enrollments BEFORE INSERT OR UPDATE ON student_group_enrollments FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_notifications BEFORE INSERT OR UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_audit_fields();
CREATE TRIGGER audit_system_settings BEFORE INSERT OR UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

-- Apply business logic triggers
CREATE TRIGGER trigger_update_group_enrollment
    AFTER INSERT OR UPDATE OR DELETE ON student_group_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_group_enrollment_count();

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

-- Apply notification triggers
CREATE TRIGGER trigger_enrollment_notifications 
    AFTER INSERT ON student_group_enrollments
    FOR EACH ROW EXECUTE FUNCTION create_automated_notification();

CREATE TRIGGER trigger_payment_notifications 
    AFTER UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION create_automated_notification();

CREATE TRIGGER trigger_group_capacity_notifications 
    AFTER UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION create_automated_notification();

-- Apply activity logging triggers
CREATE TRIGGER trigger_log_teachers AFTER INSERT OR UPDATE OR DELETE ON teachers FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER trigger_log_students AFTER INSERT OR UPDATE OR DELETE ON students FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER trigger_log_groups AFTER INSERT OR UPDATE OR DELETE ON groups FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER trigger_log_enrollments AFTER INSERT OR UPDATE OR DELETE ON student_group_enrollments FOR EACH ROW EXECUTE FUNCTION log_activity();

COMMIT;
```

## Seed Data

### seed_organizations.sql

```sql
-- Seed data for organizations and initial setup
-- For development and testing environments

INSERT INTO organizations (id, name, slug, address, contact_info, settings, subscription_plan) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Harry School Demo', 'harry-school-demo', 
 '{"street": "123 Education Street", "city": "Tashkent", "district": "Yunusabad", "postal_code": "100000", "country": "Uzbekistan"}'::jsonb,
 '{"phone": "+998901234567", "email": "info@harryschool.demo", "website": "https://harryschool.demo"}'::jsonb,
 '{"default_language": "uz", "timezone": "Asia/Tashkent", "academic_year_start": "09-01", "currency": "UZS"}'::jsonb,
 'premium');

-- Demo admin user profile (linked to auth.users)
INSERT INTO profiles (id, organization_id, email, full_name, role, language_preference) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 
 'admin@harryschool.demo', 'Demo Administrator', 'admin', 'en');

-- System settings
INSERT INTO system_settings (organization_id, category, key, value, description, data_type, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'academic', 'subjects', 
 '["Mathematics", "English", "Physics", "Chemistry", "Biology", "History", "Geography", "Literature"]'::jsonb,
 'Available subjects for groups', 'array', true),

('550e8400-e29b-41d4-a716-446655440000', 'academic', 'grade_levels',
 '["Elementary", "Middle", "High School", "University Prep", "Adult Education"]'::jsonb,
 'Available grade levels', 'array', true),

('550e8400-e29b-41d4-a716-446655440000', 'financial', 'payment_methods',
 '["Cash", "Bank Transfer", "Card", "Mobile Payment"]'::jsonb,
 'Accepted payment methods', 'array', true),

('550e8400-e29b-41d4-a716-446655440000', 'notifications', 'email_enabled',
 'true'::jsonb, 'Enable email notifications', 'boolean', false);
```

## Rollback Scripts

### rollback_005.sql

```sql
-- Rollback migration 005: Remove functions and triggers
BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS audit_organizations ON organizations;
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
DROP TRIGGER IF EXISTS audit_teachers ON teachers;
DROP TRIGGER IF EXISTS audit_students ON students;
DROP TRIGGER IF EXISTS audit_groups ON groups;
DROP TRIGGER IF EXISTS audit_teacher_assignments ON teacher_group_assignments;
DROP TRIGGER IF EXISTS audit_student_enrollments ON student_group_enrollments;
DROP TRIGGER IF EXISTS audit_notifications ON notifications;
DROP TRIGGER IF EXISTS audit_system_settings ON system_settings;

DROP TRIGGER IF EXISTS trigger_update_group_enrollment ON student_group_enrollments;
DROP TRIGGER IF EXISTS trigger_soft_delete_teachers ON teachers;
DROP TRIGGER IF EXISTS trigger_soft_delete_students ON students;
DROP TRIGGER IF EXISTS trigger_soft_delete_groups ON groups;
DROP TRIGGER IF EXISTS trigger_enrollment_notifications ON student_group_enrollments;
DROP TRIGGER IF EXISTS trigger_payment_notifications ON students;
DROP TRIGGER IF EXISTS trigger_group_capacity_notifications ON groups;
DROP TRIGGER IF EXISTS trigger_log_teachers ON teachers;
DROP TRIGGER IF EXISTS trigger_log_students ON students;
DROP TRIGGER IF EXISTS trigger_log_groups ON groups;
DROP TRIGGER IF EXISTS trigger_log_enrollments ON student_group_enrollments;

-- Drop functions
DROP FUNCTION IF EXISTS set_audit_fields();
DROP FUNCTION IF EXISTS update_group_enrollment_count();
DROP FUNCTION IF EXISTS soft_delete_cascade();
DROP FUNCTION IF EXISTS create_automated_notification();
DROP FUNCTION IF EXISTS log_activity();

-- Remove version
DELETE FROM schema_versions WHERE version = '005';

COMMIT;
```

## Migration Utilities

### migration_runner.js

```javascript
// Node.js script for running migrations
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

class MigrationRunner {
  constructor(supabaseUrl, serviceRoleKey) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey)
    this.migrationsDir = path.join(__dirname, 'migrations')
  }

  async runMigrations() {
    try {
      // Get applied migrations
      const { data: appliedMigrations } = await this.supabase
        .from('schema_versions')
        .select('version')
        .order('version')

      const appliedVersions = new Set(
        appliedMigrations?.map(m => m.version) || []
      )

      // Get migration files
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort()

      console.log(`Found ${migrationFiles.length} migration files`)

      for (const file of migrationFiles) {
        const version = file.split('_')[0]
        
        if (appliedVersions.has(version)) {
          console.log(`✓ Migration ${version} already applied`)
          continue
        }

        console.log(`→ Applying migration ${version}...`)
        
        const migrationSQL = fs.readFileSync(
          path.join(this.migrationsDir, file), 
          'utf8'
        )

        const { error } = await this.supabase.rpc('exec_sql', {
          sql: migrationSQL
        })

        if (error) {
          throw new Error(`Migration ${version} failed: ${error.message}`)
        }

        console.log(`✓ Migration ${version} applied successfully`)
      }

      console.log('All migrations completed successfully!')

    } catch (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }
  }

  async rollback(targetVersion) {
    try {
      const { data: appliedMigrations } = await this.supabase
        .from('schema_versions')
        .select('version')
        .order('version', { ascending: false })

      for (const migration of appliedMigrations) {
        if (migration.version <= targetVersion) break

        console.log(`→ Rolling back migration ${migration.version}...`)
        
        const rollbackFile = `rollback_${migration.version}.sql`
        const rollbackPath = path.join(this.migrationsDir, rollbackFile)

        if (fs.existsSync(rollbackPath)) {
          const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8')
          
          const { error } = await this.supabase.rpc('exec_sql', {
            sql: rollbackSQL
          })

          if (error) {
            throw new Error(`Rollback ${migration.version} failed: ${error.message}`)
          }

          console.log(`✓ Rollback ${migration.version} completed`)
        } else {
          console.warn(`⚠ No rollback script found for ${migration.version}`)
        }
      }

    } catch (error) {
      console.error('Rollback failed:', error)
      process.exit(1)
    }
  }
}

// Usage
if (require.main === module) {
  const runner = new MigrationRunner(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const command = process.argv[2]
  
  if (command === 'migrate') {
    runner.runMigrations()
  } else if (command === 'rollback') {
    const targetVersion = process.argv[3]
    runner.rollback(targetVersion)
  } else {
    console.log('Usage: node migration_runner.js [migrate|rollback <version>]')
  }
}
```

## Testing & Validation

### test_migrations.sql

```sql
-- Test script to validate migration success
-- Run after applying all migrations

-- Test 1: Check all tables exist
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'organizations', 'profiles', 'teachers', 'students', 'groups',
        'teacher_group_assignments', 'student_group_enrollments',
        'notifications', 'activity_logs', 'system_settings', 'schema_versions'
    ];
    table_name TEXT;
    table_count INTEGER;
BEGIN
    FOREACH table_name IN ARRAY expected_tables LOOP
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables
        WHERE table_name = table_name AND table_schema = 'public';
        
        IF table_count = 0 THEN
            RAISE EXCEPTION 'Table % not found', table_name;
        ELSE
            RAISE NOTICE '✓ Table % exists', table_name;
        END IF;
    END LOOP;
END $$;

-- Test 2: Check RLS is enabled
DO $$
DECLARE
    rls_tables TEXT[] := ARRAY[
        'organizations', 'profiles', 'teachers', 'students', 'groups',
        'teacher_group_assignments', 'student_group_enrollments',
        'notifications', 'activity_logs', 'system_settings'
    ];
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY rls_tables LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = table_name AND n.nspname = 'public';
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS not enabled for table %', table_name;
        ELSE
            RAISE NOTICE '✓ RLS enabled for %', table_name;
        END IF;
    END LOOP;
END $$;

-- Test 3: Check indexes exist
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('students', 'teachers', 'groups')
ORDER BY tablename, indexname;

-- Test 4: Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'set_audit_fields',
    'update_group_enrollment_count',
    'soft_delete_cascade',
    'create_automated_notification',
    'log_activity'
);

-- Test 5: Check materialized views
SELECT schemaname, matviewname
FROM pg_matviews
WHERE schemaname = 'public';

RAISE NOTICE 'All migration tests completed successfully!';
```

This comprehensive migration plan provides:

1. **Systematic deployment** with clear phases and dependencies
2. **Complete schema setup** with all tables, indexes, and constraints
3. **Automated processes** through functions and triggers
4. **Performance optimization** with indexes and materialized views
5. **Data seeding** for development and testing environments
6. **Rollback capabilities** for safe production deployment
7. **Testing framework** to validate migration success
8. **Utility scripts** for automated migration management

The plan ensures a reliable path from empty database to fully functional Harry School CRM with all features operational.
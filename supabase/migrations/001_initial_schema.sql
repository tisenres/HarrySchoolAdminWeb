-- Harry School CRM Initial Schema Migration
-- Version: 1.0.0

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'viewer');

-- Organizations table (multi-tenant foundation)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    address JSONB,
    contact_info JSONB,
    settings JSONB DEFAULT '{}'::jsonb,
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

-- Profiles table (extending auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'admin',
    
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

-- Teachers table
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
    employee_id TEXT,
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
    contract_type TEXT CHECK (contract_type IN ('full_time', 'part_time', 'contract', 'substitute')),
    salary_amount DECIMAL(10,2),
    salary_currency TEXT DEFAULT 'UZS',
    
    -- Education & Qualifications
    qualifications JSONB DEFAULT '[]'::jsonb,
    specializations TEXT[] DEFAULT '{}',
    certifications JSONB DEFAULT '[]'::jsonb,
    languages_spoken TEXT[] DEFAULT '{}',
    
    -- Contact & Personal
    address JSONB,
    emergency_contact JSONB,
    documents JSONB DEFAULT '[]'::jsonb,
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

-- Students table
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
    student_id TEXT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    enrollment_status TEXT DEFAULT 'active' CHECK (enrollment_status IN ('active', 'inactive', 'graduated', 'transferred', 'expelled', 'on_hold')),
    grade_level TEXT,
    
    -- Contact Information
    primary_phone TEXT,
    secondary_phone TEXT,
    email TEXT,
    address JSONB,
    
    -- Family Information
    parent_guardian_info JSONB DEFAULT '[]'::jsonb,
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    family_notes TEXT,
    
    -- Academic Information
    previous_education JSONB,
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
    documents JSONB DEFAULT '[]'::jsonb,
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

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    name TEXT NOT NULL,
    description TEXT,
    group_code TEXT,
    
    -- Academic Information
    subject TEXT NOT NULL,
    level TEXT,
    curriculum JSONB,
    
    -- Scheduling
    schedule JSONB NOT NULL,
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

-- Teacher-Group assignments (many-to-many)
CREATE TABLE teacher_group_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Assignment Details
    role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'assistant', 'substitute', 'observer')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Compensation
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

-- Student-Group enrollments (many-to-many with history)
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
    attendance_rate DECIMAL(5,2),
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

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Recipient Information
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_target TEXT[],
    
    -- Notification Content
    type TEXT NOT NULL CHECK (type IN ('system', 'enrollment', 'payment', 'schedule', 'achievement', 'reminder', 'alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Activity logs for audit trail
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Actor Information
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    
    -- Action Information
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
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

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Setting Details
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    
    -- Metadata
    data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, category, key)
);

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
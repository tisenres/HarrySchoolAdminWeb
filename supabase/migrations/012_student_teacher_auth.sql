-- Migration: Student and Teacher Authentication Bridge Tables
-- Description: Creates authentication bridge between auth.users and students/teachers
-- Version: 012
-- Author: Claude Code
-- Date: 2025-01-20

-- Create student_profiles table (bridges auth.users to students)
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    username VARCHAR(20) NOT NULL UNIQUE,
    password_visible VARCHAR(20) NOT NULL, -- For admin display only
    is_minor BOOLEAN DEFAULT true,
    guardian_consent_date TIMESTAMPTZ,
    guardian_email TEXT,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    UNIQUE(student_id),
    UNIQUE(username)
);

-- Create teacher_profiles table (bridges auth.users to teachers)  
CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    username VARCHAR(20) NOT NULL UNIQUE,
    password_visible VARCHAR(20) NOT NULL, -- For admin display only
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    UNIQUE(teacher_id),
    UNIQUE(username)
);

-- Create indexes for performance
CREATE INDEX idx_student_profiles_organization ON student_profiles(organization_id);
CREATE INDEX idx_student_profiles_student ON student_profiles(student_id);
CREATE INDEX idx_student_profiles_username ON student_profiles(username);
CREATE INDEX idx_student_profiles_active ON student_profiles(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_teacher_profiles_organization ON teacher_profiles(organization_id);
CREATE INDEX idx_teacher_profiles_teacher ON teacher_profiles(teacher_id);
CREATE INDEX idx_teacher_profiles_username ON teacher_profiles(username);
CREATE INDEX idx_teacher_profiles_active ON teacher_profiles(is_active) WHERE deleted_at IS NULL;

-- Enable RLS on new tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Student profiles policies
CREATE POLICY "Students can view their own profile" ON student_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Students can update their own profile" ON student_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view student profiles in their organization" ON student_profiles
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage student profiles in their organization" ON student_profiles
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

-- Teacher profiles policies
CREATE POLICY "Teachers can view their own profile" ON teacher_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Teachers can update their own profile" ON teacher_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view teacher profiles in their organization" ON teacher_profiles
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage teacher profiles in their organization" ON teacher_profiles
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_profiles_updated_at 
    BEFORE UPDATE ON teacher_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update login tracking
CREATE OR REPLACE FUNCTION update_login_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Update login count and timestamp for student profiles
    IF TG_TABLE_NAME = 'student_profiles' THEN
        UPDATE student_profiles 
        SET 
            login_count = login_count + 1,
            last_login_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    -- Update login count and timestamp for teacher profiles  
    IF TG_TABLE_NAME = 'teacher_profiles' THEN
        UPDATE teacher_profiles 
        SET 
            login_count = login_count + 1,
            last_login_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if student/teacher has auth profile
CREATE OR REPLACE FUNCTION has_auth_profile(entity_id UUID, entity_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF entity_type = 'student' THEN
        RETURN EXISTS (
            SELECT 1 FROM student_profiles 
            WHERE student_id = entity_id AND deleted_at IS NULL
        );
    ELSIF entity_type = 'teacher' THEN
        RETURN EXISTS (
            SELECT 1 FROM teacher_profiles 
            WHERE teacher_id = entity_id AND deleted_at IS NULL
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE student_profiles IS 'Authentication bridge table linking auth.users to students';
COMMENT ON TABLE teacher_profiles IS 'Authentication bridge table linking auth.users to teachers';
COMMENT ON COLUMN student_profiles.password_visible IS 'Plain text password for admin display only - NOT for authentication';
COMMENT ON COLUMN teacher_profiles.password_visible IS 'Plain text password for admin display only - NOT for authentication';
COMMENT ON COLUMN student_profiles.is_minor IS 'True if student is under 18, requires guardian consent';
COMMENT ON FUNCTION has_auth_profile IS 'Check if a student or teacher has an authentication profile';
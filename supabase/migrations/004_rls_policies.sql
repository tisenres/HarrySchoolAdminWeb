-- Harry School CRM Row Level Security Policies Migration
-- Version: 1.0.3

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_group_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        is_superadmin() OR 
        id = get_user_organization()
    );

CREATE POLICY "Superadmins can manage all organizations" ON organizations
    FOR ALL USING (is_superadmin());

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization() AND 
        get_user_role() IN ('admin', 'superadmin')
    );

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization" ON profiles
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their organization" ON profiles
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() = 'admin')
    );

-- Teachers policies
CREATE POLICY "Users can view teachers in their organization" ON teachers
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage teachers in their organization" ON teachers
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

CREATE POLICY "Viewers have read-only access to teachers" ON teachers
    FOR SELECT USING (
        organization_id = get_user_organization() AND 
        get_user_role() IN ('viewer', 'admin', 'superadmin')
    );

-- Students policies
CREATE POLICY "Users can view students in their organization" ON students
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage students in their organization" ON students
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

CREATE POLICY "Viewers have read-only access to students" ON students
    FOR SELECT USING (
        organization_id = get_user_organization() AND 
        get_user_role() IN ('viewer', 'admin', 'superadmin')
    );

-- Groups policies
CREATE POLICY "Users can view groups in their organization" ON groups
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage groups in their organization" ON groups
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

CREATE POLICY "Viewers have read-only access to groups" ON groups
    FOR SELECT USING (
        organization_id = get_user_organization() AND 
        get_user_role() IN ('viewer', 'admin', 'superadmin')
    );

-- Teacher assignments policies
CREATE POLICY "Users can view assignments in their organization" ON teacher_group_assignments
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage assignments in their organization" ON teacher_group_assignments
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

-- Student enrollments policies
CREATE POLICY "Users can view enrollments in their organization" ON student_group_enrollments
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage enrollments in their organization" ON student_group_enrollments
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND 
         (user_id = auth.uid() OR user_id IS NULL OR get_user_role() = ANY(role_target)))
    );

CREATE POLICY "Users can update their own notification read status" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage notifications in their organization" ON notifications
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

-- Activity logs policies (read-only for audit trail integrity)
CREATE POLICY "Users can view activity logs in their organization" ON activity_logs
    FOR SELECT USING (
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true); -- Allow system to log activities

-- System settings policies
CREATE POLICY "Users can view public settings" ON system_settings
    FOR SELECT USING (
        is_public = true OR 
        is_superadmin() OR 
        organization_id = get_user_organization()
    );

CREATE POLICY "Admins can manage organization settings" ON system_settings
    FOR ALL USING (
        is_superadmin() OR 
        (organization_id = get_user_organization() AND get_user_role() IN ('admin', 'superadmin'))
    );

CREATE POLICY "Superadmins can manage global settings" ON system_settings
    FOR ALL USING (
        is_superadmin() AND organization_id IS NULL
    );

-- Update schema version
INSERT INTO schema_versions (version, description) 
VALUES ('1.0.3', 'Added Row Level Security policies for multi-tenant isolation');
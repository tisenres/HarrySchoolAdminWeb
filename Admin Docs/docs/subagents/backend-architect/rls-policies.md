# Row Level Security (RLS) Policies - Harry School CRM

## RLS Overview

The Harry School CRM implements comprehensive Row Level Security to ensure complete data isolation between organizations and proper access control based on user roles. All policies enforce multi-tenant architecture with organization-scoped data access.

## Security Principles

1. **Organization Isolation**: Users can only access data from their organization
2. **Role-Based Access**: Different permissions for superadmin, admin, and viewer roles
3. **Audit Trail Protection**: Users cannot modify audit fields directly
4. **Soft Delete Respect**: Deleted records are hidden from normal operations
5. **Performance Optimized**: Policies designed to work with existing indexes

## Core RLS Functions

### User Context Functions

```sql
-- Get current user's profile information
CREATE OR REPLACE FUNCTION auth.current_user_profile()
RETURNS profiles AS $$
DECLARE
    profile profiles;
BEGIN
    SELECT * INTO profile
    FROM profiles
    WHERE id = auth.uid()
    AND deleted_at IS NULL;
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION auth.current_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM profiles
    WHERE id = auth.uid()
    AND deleted_at IS NULL;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid()
    AND deleted_at IS NULL;
    
    RETURN CASE
        WHEN required_role = 'viewer' THEN user_role IN ('viewer', 'admin', 'superadmin')
        WHEN required_role = 'admin' THEN user_role IN ('admin', 'superadmin')
        WHEN required_role = 'superadmin' THEN user_role = 'superadmin'
        ELSE false
    END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user can modify records (admin or superadmin)
CREATE OR REPLACE FUNCTION auth.can_modify()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.has_role('admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

## Organizations Table RLS

```sql
-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Superadmins can see all organizations, others only their own
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT
    USING (
        id = auth.current_user_organization_id() 
        OR auth.has_role('superadmin')
    );

-- Only superadmins can create organizations
CREATE POLICY "Superadmins can create organizations" ON organizations
    FOR INSERT
    WITH CHECK (auth.has_role('superadmin'));

-- Only superadmins can update organizations
CREATE POLICY "Superadmins can update organizations" ON organizations
    FOR UPDATE
    USING (auth.has_role('superadmin'))
    WITH CHECK (auth.has_role('superadmin'));

-- Only superadmins can delete organizations (soft delete)
CREATE POLICY "Superadmins can delete organizations" ON organizations
    FOR UPDATE
    USING (
        auth.has_role('superadmin')
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.has_role('superadmin')
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Profiles Table RLS

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles in their organization
CREATE POLICY "Users can view organization profiles" ON profiles
    FOR SELECT
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    );

-- Only admins can create new profiles
CREATE POLICY "Admins can create profiles" ON profiles
    FOR INSERT
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Users can update their own profile, admins can update any in their org
CREATE POLICY "Users can update profiles" ON profiles
    FOR UPDATE
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
        AND (
            id = auth.uid() -- Users can update their own profile
            OR auth.can_modify() -- Admins can update any profile in their org
        )
    )
    WITH CHECK (
        organization_id = auth.current_user_organization_id()
        AND (
            id = auth.uid()
            OR auth.can_modify()
        )
    );

-- Only admins can soft delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Teachers Table RLS

```sql
-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Users can view active teachers in their organization
CREATE POLICY "Users can view teachers" ON teachers
    FOR SELECT
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    );

-- Only admins can create teachers
CREATE POLICY "Admins can create teachers" ON teachers
    FOR INSERT
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can update teachers
CREATE POLICY "Admins can update teachers" ON teachers
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can soft delete teachers
CREATE POLICY "Admins can delete teachers" ON teachers
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Students Table RLS

```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Users can view active students in their organization
CREATE POLICY "Users can view students" ON students
    FOR SELECT
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    );

-- Only admins can create students
CREATE POLICY "Admins can create students" ON students
    FOR INSERT
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can update students
CREATE POLICY "Admins can update students" ON students
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can soft delete students
CREATE POLICY "Admins can delete students" ON students
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Groups Table RLS

```sql
-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users can view active groups in their organization
CREATE POLICY "Users can view groups" ON groups
    FOR SELECT
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    );

-- Only admins can create groups
CREATE POLICY "Admins can create groups" ON groups
    FOR INSERT
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can update groups
CREATE POLICY "Admins can update groups" ON groups
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can soft delete groups
CREATE POLICY "Admins can delete groups" ON groups
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Teacher Group Assignments RLS

```sql
-- Enable RLS
ALTER TABLE teacher_group_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view assignments in their organization
CREATE POLICY "Users can view teacher assignments" ON teacher_group_assignments
    FOR SELECT
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    );

-- Only admins can create assignments
CREATE POLICY "Admins can create teacher assignments" ON teacher_group_assignments
    FOR INSERT
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        -- Ensure teacher and group belong to the same organization
        AND EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.id = teacher_id 
            AND t.organization_id = organization_id
            AND t.deleted_at IS NULL
        )
        AND EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_id 
            AND g.organization_id = organization_id
            AND g.deleted_at IS NULL
        )
    );

-- Only admins can update assignments
CREATE POLICY "Admins can update teacher assignments" ON teacher_group_assignments
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can delete assignments
CREATE POLICY "Admins can delete teacher assignments" ON teacher_group_assignments
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Student Group Enrollments RLS

```sql
-- Enable RLS
ALTER TABLE student_group_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view enrollments in their organization
CREATE POLICY "Users can view student enrollments" ON student_group_enrollments
    FOR SELECT
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    );

-- Only admins can create enrollments
CREATE POLICY "Admins can create student enrollments" ON student_group_enrollments
    FOR INSERT
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        -- Ensure student and group belong to the same organization
        AND EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_id 
            AND s.organization_id = organization_id
            AND s.deleted_at IS NULL
        )
        AND EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_id 
            AND g.organization_id = organization_id
            AND g.deleted_at IS NULL
        )
    );

-- Only admins can update enrollments
CREATE POLICY "Admins can update student enrollments" ON student_group_enrollments
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Only admins can delete enrollments
CREATE POLICY "Admins can delete student enrollments" ON student_group_enrollments
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Notifications Table RLS

```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view notifications for their organization and role
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
        AND (
            user_id = auth.uid() -- Direct user notifications
            OR (
                user_id IS NULL -- System-wide notifications
                AND (
                    role_target IS NULL -- All users
                    OR auth.current_user_profile().role = ANY(role_target) -- Role-specific
                )
            )
        )
    );

-- Only admins can create notifications
CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
    );

-- Users can update their own notification read status
CREATE POLICY "Users can update notification status" ON notifications
    FOR UPDATE
    USING (
        organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
        AND user_id = auth.uid()
    )
    WITH CHECK (
        organization_id = auth.current_user_organization_id()
        AND user_id = auth.uid()
        -- Only allow updating read status fields
        AND (
            (OLD.is_read != NEW.is_read OR OLD.read_at != NEW.read_at)
            AND OLD.title = NEW.title
            AND OLD.message = NEW.message
            AND OLD.type = NEW.type
        )
    );

-- Only admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON notifications
    FOR UPDATE
    USING (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.can_modify()
        AND organization_id = auth.current_user_organization_id()
        AND (deleted_at IS NOT NULL OR OLD.deleted_at IS NULL)
    );
```

## Activity Logs RLS

```sql
-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view activity logs" ON activity_logs
    FOR SELECT
    USING (
        auth.has_role('admin')
        AND organization_id = auth.current_user_organization_id()
    );

-- System can insert activity logs (no user restriction for logging)
CREATE POLICY "System can create activity logs" ON activity_logs
    FOR INSERT
    WITH CHECK (
        organization_id = auth.current_user_organization_id()
    );

-- No updates or deletes allowed on activity logs (immutable audit trail)
-- Activity logs are append-only for audit integrity
```

## System Settings RLS

```sql
-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Users can view public settings, admins can view all organization settings
CREATE POLICY "Users can view settings" ON system_settings
    FOR SELECT
    USING (
        (
            organization_id = auth.current_user_organization_id()
            AND (is_public = true OR auth.can_modify())
        )
        OR (
            organization_id IS NULL -- Global settings
            AND is_public = true
        )
        OR auth.has_role('superadmin') -- Superadmins see everything
    );

-- Only admins can create/update organization settings
CREATE POLICY "Admins can manage organization settings" ON system_settings
    FOR ALL
    USING (
        (
            auth.can_modify()
            AND organization_id = auth.current_user_organization_id()
        )
        OR auth.has_role('superadmin') -- Superadmins can manage global settings
    )
    WITH CHECK (
        (
            auth.can_modify()
            AND organization_id = auth.current_user_organization_id()
        )
        OR auth.has_role('superadmin')
    );
```

## Audit Field Protection

### Triggers to Automatically Set Audit Fields

```sql
-- Function to set audit fields on insert/update
CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_by and created_at on insert
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = auth.uid();
        NEW.created_at = NOW();
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
    END IF;
    
    -- Set updated_by and updated_at on update
    IF TG_OP = 'UPDATE' THEN
        -- Preserve original created_by and created_at
        NEW.created_by = OLD.created_by;
        NEW.created_at = OLD.created_at;
        
        -- Update modified fields
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
        
        -- Handle soft delete
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by = auth.uid();
        END IF;
    END IF;
    
    RETURN NEW;
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
```

## Performance Considerations

### RLS Policy Optimization

```sql
-- Create indexes to support RLS policies
CREATE INDEX CONCURRENTLY idx_profiles_organization_id_active 
ON profiles(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_teachers_organization_id_active 
ON teachers(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_students_organization_id_active 
ON students(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_groups_organization_id_active 
ON groups(organization_id) WHERE deleted_at IS NULL;

-- Composite indexes for common filtering patterns
CREATE INDEX CONCURRENTLY idx_notifications_user_org_unread 
ON notifications(user_id, organization_id, is_read) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_activity_logs_org_created 
ON activity_logs(organization_id, created_at DESC);
```

### RLS Testing Functions

```sql
-- Function to test RLS policies (for development/testing)
CREATE OR REPLACE FUNCTION test_rls_policy(
    test_user_id UUID,
    test_table_name TEXT,
    test_operation TEXT
)
RETURNS TABLE (
    can_access BOOLEAN,
    row_count BIGINT
) AS $$
DECLARE
    query_text TEXT;
    result_count BIGINT;
BEGIN
    -- Set the session user for testing
    PERFORM set_config('request.jwt.claim.sub', test_user_id::TEXT, true);
    
    -- Build dynamic query based on operation and table
    query_text := format('SELECT COUNT(*) FROM %I WHERE deleted_at IS NULL', test_table_name);
    
    -- Execute query and capture result
    EXECUTE query_text INTO result_count;
    
    RETURN QUERY SELECT true, result_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 0::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Best Practices

### Additional Security Measures

1. **Connection Security**:
   ```sql
   -- Force SSL connections (set in Supabase dashboard)
   -- Enable connection pooling with pgBouncer
   -- Use service role key only for server-side operations
   ```

2. **API Security**:
   ```sql
   -- Limit API key usage with proper CORS settings
   -- Implement rate limiting at application level
   -- Use anon key only for authentication operations
   ```

3. **Data Encryption**:
   ```sql
   -- Sensitive fields should be encrypted at application level
   -- Use Supabase Vault for storing encryption keys
   -- Enable database encryption at rest
   ```

### Monitoring and Alerts

```sql
-- Function to monitor failed RLS policy attempts
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        action,
        resource_type,
        description,
        success,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        auth.current_user_organization_id(),
        auth.uid(),
        'RLS_VIOLATION',
        TG_TABLE_NAME,
        'Attempted unauthorized access',
        false,
        'Row Level Security policy violation',
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

This comprehensive RLS implementation provides:

1. **Complete organizational data isolation** ensuring no cross-tenant data access
2. **Granular role-based permissions** with superadmin, admin, and viewer roles
3. **Audit trail protection** preventing unauthorized modification of tracking fields
4. **Performance optimization** with supporting indexes for RLS queries
5. **Security monitoring** with violation logging and testing capabilities
6. **Flexibility** allowing for future role expansion and permission refinement

The policies are designed to work efficiently with the database schema and support all user workflows identified in the UX research while maintaining strict security boundaries.
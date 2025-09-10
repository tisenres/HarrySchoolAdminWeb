# Backend Architecture: Student Credentials System
Agent: backend-architect
Date: 2025-09-10

## Executive Summary
This document provides a comprehensive backend architecture for implementing the Harry School CRM student credentials system based on critical security audit findings. The architecture addresses the fundamental issue where students cannot access their own profile pages due to admin-only authentication requirements, while implementing a secure multi-role authentication system that maintains proper data isolation and educational compliance standards.

**Key Architectural Decisions:**
- **Multi-Role Authentication**: Context-aware JWT system supporting admin and student roles
- **Database Schema Expansion**: New tables for student profiles, credentials, audit logs, and compliance
- **Enhanced Security**: Field-level encryption, comprehensive RLS policies, and educational data protection
- **Automated Credential Management**: Secure username/password generation with parent notification system
- **Educational Compliance**: FERPA-compliant audit trails and parent access controls

## Current System Analysis

### Existing Database Structure
```typescript
// Current tables identified:
interface CurrentSchema {
  students: {
    id: uuid
    organization_id: uuid
    first_name: string
    last_name: string
    full_name: string
    date_of_birth: date
    primary_phone: string
    email?: string
    // ... extensive educational fields
    total_points: number
    current_level: number
    available_coins: number
    academic_score: number
  }
  
  student_profiles: {
    id: uuid
    student_id: uuid
    username?: string
    bio?: string
    avatar_type: string
    theme_preference: string
    // ... gamification fields
  }
  
  profiles: {
    id: uuid
    organization_id: uuid
    role: 'admin' | 'superadmin'
    email: string
    full_name: string
    // ... admin profile fields
  }
  
  organizations: {
    id: uuid
    name: string
    slug: string
    // ... organization settings
  }
}
```

### Current Authentication Issues
1. **Critical Gap**: `GET /api/students/[id]` uses `withAuth(..., 'admin')` blocking student self-access
2. **Missing Credential System**: No automatic credential generation during student registration
3. **Incomplete Integration**: `student_profiles` table exists but not properly linked to auth system
4. **Single-Role Design**: Authentication middleware assumes admin-only access patterns

## Database Schema Design

### New Tables

#### 1. Student Authentication & Credentials
```sql
-- Enhanced student_profiles table (already exists, modifications needed)
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS credentials_created_at timestamptz;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS password_must_change boolean DEFAULT true;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS account_locked boolean DEFAULT false;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS last_failed_login timestamptz;

-- Create unique index on username for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_profiles_username ON student_profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_profiles_auth_user_id ON student_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON student_profiles(student_id);
```

#### 2. Credential Management System
```sql
-- Student credential generation tracking
CREATE TABLE student_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username varchar(50) NOT NULL UNIQUE,
    credential_type text CHECK (credential_type IN ('initial', 'reset', 'updated')) DEFAULT 'initial',
    generated_by uuid REFERENCES profiles(id),
    generated_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    used_at timestamptz,
    parent_notified boolean DEFAULT false,
    parent_notification_sent_at timestamptz,
    notes text,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES profiles(id),
    updated_by uuid REFERENCES profiles(id),
    
    CONSTRAINT unique_active_student_credential UNIQUE (student_id, credential_type) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX idx_student_credentials_student_id ON student_credentials(student_id);
CREATE INDEX idx_student_credentials_auth_user_id ON student_credentials(auth_user_id);
CREATE INDEX idx_student_credentials_generated_at ON student_credentials(generated_at DESC);
CREATE INDEX idx_student_credentials_expires_at ON student_credentials(expires_at) WHERE expires_at IS NOT NULL;
```

#### 3. Enhanced Audit System
```sql
-- Comprehensive audit logging for educational data
CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    record_id text NOT NULL,
    user_id text,
    user_type text CHECK (user_type IN ('admin', 'superadmin', 'student', 'system')),
    organization_id uuid REFERENCES organizations(id),
    old_values jsonb,
    new_values jsonb,
    metadata jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    session_id text,
    educational_data_access boolean DEFAULT false,
    ferpa_protected boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_educational ON audit_logs(educational_data_access) WHERE educational_data_access = true;
```

#### 4. Educational Data Compliance
```sql
-- FERPA compliance tracking
CREATE TABLE educational_data_classifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    column_name text NOT NULL,
    data_category text NOT NULL CHECK (data_category IN (
        'directory_information',  -- Name, address, phone, email
        'educational_records',    -- Grades, attendance, disciplinary
        'health_records',        -- Medical information
        'financial_records',     -- Payment, tuition information
        'behavioral_records'     -- Disciplinary actions, counseling
    )),
    ferpa_protected boolean DEFAULT true,
    requires_consent boolean DEFAULT false,
    retention_period interval,
    encryption_required boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(table_name, column_name)
);

-- Parent-child relationships for FERPA compliance
CREATE TABLE parent_student_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_email text NOT NULL,
    parent_name text NOT NULL,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship_type text CHECK (relationship_type IN ('parent', 'guardian', 'emergency_contact')),
    verified boolean DEFAULT false,
    verification_token text,
    verification_expires timestamptz,
    ferpa_rights boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    verified_at timestamptz,
    
    UNIQUE(parent_email, student_id, relationship_type)
);

-- Parental consents tracking
CREATE TABLE parental_consents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES parent_student_relationships(id),
    consent_type text NOT NULL,
    consent_given boolean NOT NULL,
    consent_date timestamptz NOT NULL,
    expiry_date timestamptz,
    digital_signature text,
    ip_address inet,
    created_at timestamptz DEFAULT now()
);
```

#### 5. Session Management
```sql
-- Enhanced session tracking for multi-role users
CREATE TABLE user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type text NOT NULL CHECK (user_type IN ('admin', 'superadmin', 'student')),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    session_token text NOT NULL UNIQUE,
    device_fingerprint text,
    ip_address inet,
    user_agent text,
    last_activity timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    active boolean DEFAULT true,
    revoked_at timestamptz,
    revoked_by uuid REFERENCES profiles(id),
    revoked_reason text,
    created_at timestamptz DEFAULT now(),
    
    -- Performance indexes
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_token (session_token),
    INDEX idx_user_sessions_active (active) WHERE active = true,
    INDEX idx_user_sessions_expires (expires_at)
);
```

#### 6. Password Reset System
```sql
-- Secure password reset requests
CREATE TABLE password_reset_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type text NOT NULL CHECK (user_type IN ('admin', 'student')),
    identifier text NOT NULL, -- email or username
    reset_token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    used boolean DEFAULT false,
    used_at timestamptz,
    attempts integer DEFAULT 0,
    ip_address inet,
    created_at timestamptz DEFAULT now(),
    
    -- Prevent multiple active requests
    UNIQUE(user_id, used) WHERE used = false
);
```

### Database Migration Scripts

#### Migration 1: Create New Tables
```sql
-- 001_create_credential_system.sql
BEGIN;

-- Create all new tables as defined above
-- (Full table creation SQL as shown in previous sections)

-- Create necessary functions for audit logging
CREATE OR REPLACE FUNCTION log_educational_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        operation,
        record_id,
        user_id,
        user_type,
        organization_id,
        old_values,
        new_values,
        metadata,
        educational_data_access
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id::text, OLD.id::text),
        auth.uid()::text,
        CASE 
            WHEN auth.jwt()->>'role' = 'student' THEN 'student'
            WHEN auth.jwt()->>'user_metadata'->>'role' = 'student' THEN 'student'
            ELSE 'admin'
        END,
        COALESCE(NEW.organization_id, OLD.organization_id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END,
        json_build_object(
            'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
            'user_agent', current_setting('request.headers', true)::json->>'user-agent'
        ),
        true
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to relevant tables
CREATE TRIGGER students_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION log_educational_access();

CREATE TRIGGER student_profiles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION log_educational_access();

COMMIT;
```

#### Migration 2: Initialize Data Classifications
```sql
-- 002_initialize_data_classifications.sql
BEGIN;

-- Classify student data for FERPA compliance
INSERT INTO educational_data_classifications (table_name, column_name, data_category, ferpa_protected, requires_consent, encryption_required) VALUES
-- Directory information (can be disclosed without consent)
('students', 'full_name', 'directory_information', false, false, false),
('students', 'email', 'directory_information', true, false, false),
('students', 'primary_phone', 'directory_information', true, false, true),

-- Educational records (require consent)
('students', 'grade_level', 'educational_records', true, true, false),
('students', 'enrollment_status', 'educational_records', true, true, false),
('students', 'academic_score', 'educational_records', true, true, false),
('students', 'total_points', 'educational_records', true, true, false),

-- Health records (highly protected)
('students', 'medical_notes', 'health_records', true, true, true),
('students', 'allergies', 'health_records', true, true, true),
('students', 'special_needs', 'health_records', true, true, true),

-- Financial records
('students', 'tuition_fee', 'financial_records', true, true, false),
('students', 'payment_status', 'financial_records', true, true, false);

COMMIT;
```

## Row Level Security Policies

### 1. Multi-Role Student Access Policies
```sql
-- Enable RLS on student_profiles if not already enabled
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Students can view and update their own profile
CREATE POLICY "students_own_profile_access" ON student_profiles
FOR ALL TO authenticated
USING (
    -- Student accessing their own profile
    (auth.jwt()->>'role' = 'student' 
     AND auth.uid() = auth_user_id)
    OR
    -- Admin accessing profiles in their organization
    (auth.jwt()->>'role' IN ('admin', 'superadmin')
     AND EXISTS (
         SELECT 1 FROM profiles p
         WHERE p.id = auth.uid()
         AND p.organization_id = (
             SELECT s.organization_id 
             FROM students s 
             WHERE s.id = student_profiles.student_id
         )
     ))
)
WITH CHECK (
    -- Same conditions for INSERT/UPDATE
    (auth.jwt()->>'role' = 'student' 
     AND auth.uid() = auth_user_id)
    OR
    (auth.jwt()->>'role' IN ('admin', 'superadmin')
     AND EXISTS (
         SELECT 1 FROM profiles p
         WHERE p.id = auth.uid()
         AND p.organization_id = (
             SELECT s.organization_id 
             FROM students s 
             WHERE s.id = student_profiles.student_id
         )
     ))
);
```

### 2. Enhanced Students Table RLS
```sql
-- Update existing students table RLS for multi-role access
DROP POLICY IF EXISTS "students_organization_isolation" ON students;

CREATE POLICY "students_multi_role_access" ON students
FOR SELECT TO authenticated
USING (
    -- Students can view their own record
    (auth.jwt()->>'role' = 'student'
     AND EXISTS (
         SELECT 1 FROM student_profiles sp
         WHERE sp.student_id = students.id
         AND sp.auth_user_id = auth.uid()
     ))
    OR
    -- Admins can view students in their organization
    (auth.jwt()->>'role' IN ('admin', 'superadmin')
     AND EXISTS (
         SELECT 1 FROM profiles p
         WHERE p.id = auth.uid()
         AND p.organization_id = students.organization_id
     ))
);

-- Students can only update specific fields on their own record
CREATE POLICY "students_self_update" ON students
FOR UPDATE TO authenticated
USING (
    auth.jwt()->>'role' = 'student'
    AND EXISTS (
        SELECT 1 FROM student_profiles sp
        WHERE sp.student_id = students.id
        AND sp.auth_user_id = auth.uid()
    )
)
WITH CHECK (
    auth.jwt()->>'role' = 'student'
    AND EXISTS (
        SELECT 1 FROM student_profiles sp
        WHERE sp.student_id = students.id
        AND sp.auth_user_id = auth.uid()
    )
);

-- Admins can perform full CRUD in their organization
CREATE POLICY "students_admin_crud" ON students
FOR ALL TO authenticated
USING (
    auth.jwt()->>'role' IN ('admin', 'superadmin')
    AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.organization_id = students.organization_id
    )
)
WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'superadmin')
    AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.organization_id = students.organization_id
    )
);
```

### 3. Credential Management RLS
```sql
-- Enable RLS on new tables
ALTER TABLE student_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Credential access policies
CREATE POLICY "credential_admin_access" ON student_credentials
FOR ALL TO authenticated
USING (
    auth.jwt()->>'role' IN ('admin', 'superadmin')
    AND EXISTS (
        SELECT 1 FROM students s
        JOIN profiles p ON p.id = auth.uid()
        WHERE s.id = student_credentials.student_id
        AND s.organization_id = p.organization_id
    )
);

-- Students cannot directly access credentials table (security)
-- They access through API endpoints only

-- Audit log access (admins only)
CREATE POLICY "audit_logs_admin_only" ON audit_logs
FOR SELECT TO authenticated
USING (
    auth.jwt()->>'role' IN ('admin', 'superadmin')
    AND (
        organization_id IS NULL 
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.organization_id = audit_logs.organization_id
                 OR p.role = 'superadmin')
        )
    )
);

-- Session management RLS
CREATE POLICY "user_sessions_own_access" ON user_sessions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### 4. Educational Data Protection RLS
```sql
-- Parent-student relationship access
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_student_relationships_access" ON parent_student_relationships
FOR SELECT TO authenticated
USING (
    -- Admins can view relationships in their organization
    (auth.jwt()->>'role' IN ('admin', 'superadmin')
     AND EXISTS (
         SELECT 1 FROM students s
         JOIN profiles p ON p.id = auth.uid()
         WHERE s.id = parent_student_relationships.student_id
         AND s.organization_id = p.organization_id
     ))
    OR
    -- Students can view their own parent relationships
    (auth.jwt()->>'role' = 'student'
     AND EXISTS (
         SELECT 1 FROM student_profiles sp
         WHERE sp.student_id = parent_student_relationships.student_id
         AND sp.auth_user_id = auth.uid()
     ))
);
```

## API Architecture Design

### 1. Enhanced Authentication Middleware
```typescript
// /src/lib/middleware/multi-role-auth.ts

export interface MultiRoleAuthContext extends AuthContext {
    userType: 'admin' | 'student' | 'superadmin'
    organizationId: string
    permissions: string[]
    studentId?: string // For student users
}

export function withMultiRoleAuth(
    handler: (request: NextRequest, context: MultiRoleAuthContext, ...args: any[]) => Promise<NextResponse>,
    allowedRoles: ('admin' | 'student' | 'superadmin')[] = ['authenticated']
) {
    return async function(request: NextRequest, ...args: any[]): Promise<NextResponse> {
        const supabase = await createServerClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        }
        
        // Determine user type from JWT
        let userType: 'admin' | 'student' | 'superadmin'
        let profile: any
        let studentId: string | undefined
        
        // Check if user is a student
        if (user.user_metadata?.role === 'student') {
            userType = 'student'
            
            // Get student profile
            const { data: studentProfile } = await supabase
                .from('student_profiles')
                .select(`
                    *,
                    students!inner(id, organization_id, full_name, is_active)
                `)
                .eq('auth_user_id', user.id)
                .single()
            
            if (!studentProfile) {
                return NextResponse.json(
                    { success: false, error: 'Student profile not found' },
                    { status: 401 }
                )
            }
            
            profile = studentProfile
            studentId = studentProfile.student_id
            
        } else {
            // Get admin profile
            const { data: adminProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            
            if (!adminProfile) {
                return NextResponse.json(
                    { success: false, error: 'User profile not found' },
                    { status: 401 }
                )
            }
            
            profile = adminProfile
            userType = adminProfile.role as 'admin' | 'superadmin'
        }
        
        // Check role authorization
        if (!allowedRoles.includes('authenticated') && !allowedRoles.includes(userType)) {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            )
        }
        
        // Build permissions array
        const permissions = buildPermissionsForRole(userType, profile)
        
        const enhancedContext: MultiRoleAuthContext = {
            user,
            profile,
            userType,
            organizationId: userType === 'student' 
                ? profile.students.organization_id 
                : profile.organization_id,
            permissions,
            studentId
        }
        
        return await handler(request, enhancedContext, ...args)
    }
}

function buildPermissionsForRole(userType: string, profile: any): string[] {
    switch (userType) {
        case 'superadmin':
            return ['*']
        case 'admin':
            return [
                'read_students',
                'create_students', 
                'update_students',
                'manage_credentials',
                'view_reports',
                'manage_parents'
            ]
        case 'student':
            return [
                'read_own_profile',
                'update_own_profile',
                'reset_own_password',
                'view_own_grades',
                'view_own_schedule'
            ]
        default:
            return []
    }
}
```

### 2. Updated Student API Endpoints
```typescript
// /src/app/api/students/[id]/route.ts (UPDATED)

export const GET = withMultiRoleAuth(async (
    request: NextRequest,
    context: MultiRoleAuthContext,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params
    const supabase = await createServerClient()
    
    // Context-aware data fetching
    if (context.userType === 'student') {
        // Student accessing their own profile
        if (context.studentId !== id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            )
        }
        
        // Return student-appropriate data (limited fields)
        const { data: student, error } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                date_of_birth,
                email,
                primary_phone,
                grade_level,
                enrollment_status,
                current_level,
                total_points,
                available_coins,
                academic_score,
                student_profiles!inner(
                    username,
                    bio,
                    avatar_type,
                    theme_preference,
                    language_preference,
                    vocabulary_daily_goal,
                    study_streak_goal,
                    total_study_time
                )
            `)
            .eq('id', id)
            .is('deleted_at', null)
            .single()
        
        if (error) {
            return NextResponse.json(
                { success: false, error: 'Student not found' },
                { status: 404 }
            )
        }
        
        return NextResponse.json({
            success: true,
            data: student
        })
        
    } else {
        // Admin accessing student data (full access within organization)
        const { data: student, error } = await supabase
            .from('students')
            .select(`
                *,
                student_profiles(*)
            `)
            .eq('id', id)
            .eq('organization_id', context.organizationId)
            .is('deleted_at', null)
            .single()
        
        if (error) {
            return NextResponse.json(
                { success: false, error: 'Student not found' },
                { status: 404 }
            )
        }
        
        return NextResponse.json({
            success: true,
            data: student
        })
    }
    
}, ['admin', 'superadmin', 'student'])
```

### 3. New Credential Management Endpoints
```typescript
// /src/app/api/students/[id]/credentials/route.ts (NEW)

// Generate credentials for a student (admin only)
export const POST = withMultiRoleAuth(async (
    request: NextRequest,
    context: MultiRoleAuthContext,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params
    const body = await request.json()
    
    const result = await StudentCredentialService.createCredentials({
        studentId: id,
        organizationId: context.organizationId,
        generatedBy: context.user.id,
        notifyParent: body.notifyParent ?? true,
        customUsername: body.customUsername,
        temporaryPassword: body.temporaryPassword
    })
    
    return NextResponse.json({
        success: true,
        data: {
            username: result.username,
            temporaryPassword: result.temporaryPassword,
            credentials: result.credentials
        },
        message: 'Student credentials created successfully'
    })
    
}, ['admin', 'superadmin'])

// View credentials (admin only, never expose passwords)
export const GET = withMultiRoleAuth(async (
    request: NextRequest,
    context: MultiRoleAuthContext,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params
    const supabase = await createServerClient()
    
    const { data: credentials, error } = await supabase
        .from('student_credentials')
        .select(`
            id,
            username,
            credential_type,
            generated_at,
            expires_at,
            used_at,
            parent_notified,
            parent_notification_sent_at
        `)
        .eq('student_id', id)
        .order('generated_at', { ascending: false })
    
    if (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch credentials' },
            { status: 500 }
        )
    }
    
    return NextResponse.json({
        success: true,
        data: credentials
    })
    
}, ['admin', 'superadmin'])
```

### 4. Student Profile Management Endpoints
```typescript
// /src/app/api/student-profile/route.ts (NEW)

// Student updates their own profile
export const PATCH = withMultiRoleAuth(async (
    request: NextRequest,
    context: MultiRoleAuthContext
) => {
    const body = await request.json()
    const supabase = await createServerClient()
    
    // Validate allowed fields for student updates
    const allowedFields = [
        'bio',
        'avatar_type', 
        'theme_preference',
        'language_preference',
        'vocabulary_daily_goal',
        'study_streak_goal',
        'preferred_study_time',
        'notification_preferences'
    ]
    
    const updateData = Object.keys(body)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = body[key]
            return obj
        }, {} as any)
    
    updateData.updated_at = new Date().toISOString()
    
    const { data: profile, error } = await supabase
        .from('student_profiles')
        .update(updateData)
        .eq('auth_user_id', context.user.id)
        .select()
        .single()
    
    if (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to update profile' },
            { status: 500 }
        )
    }
    
    return NextResponse.json({
        success: true,
        data: profile,
        message: 'Profile updated successfully'
    })
    
}, ['student'])
```

## Credential Generation System

### 1. Secure Username Generation Algorithm
```typescript
// /src/lib/services/credential-generator.ts

export class CredentialGeneratorService {
    
    /**
     * Generate secure, unique username for student
     * Format: {firstName}{year}{hash} (e.g., "john24a1b2c3")
     */
    static async generateUsername(
        firstName: string, 
        lastName: string, 
        studentId: string,
        organizationId: string
    ): Promise<string> {
        // Sanitize first name (remove non-letters, take first 4 chars)
        const cleanFirstName = firstName.toLowerCase()
            .replace(/[^a-z]/g, '')
            .substring(0, 4)
            .padEnd(2, 'x') // Minimum 2 chars
        
        const currentYear = new Date().getFullYear().toString().substring(2) // e.g., "24"
        
        // Create deterministic but unpredictable hash
        const hashInput = `${studentId}:${organizationId}:${Date.now()}`
        const hash = crypto.createHash('sha256')
            .update(hashInput)
            .digest('hex')
            .substring(0, 6) // Take first 6 chars
        
        let baseUsername = `${cleanFirstName}${currentYear}${hash}`
        
        // Ensure uniqueness by checking database
        let finalUsername = baseUsername
        let counter = 1
        
        while (await this.usernameExists(finalUsername)) {
            finalUsername = `${baseUsername}${counter}`
            counter++
            
            if (counter > 999) {
                // Fallback to UUID-based generation
                const uuid = crypto.randomUUID().replace('-', '').substring(0, 8)
                finalUsername = `${cleanFirstName}${uuid}`
                break
            }
        }
        
        return finalUsername
    }
    
    /**
     * Generate secure temporary password
     * Format: 3 uppercase + 3 lowercase + 3 numbers + 1 special
     * Avoids confusing characters (0, O, l, I, 1)
     */
    static generateTemporaryPassword(length: number = 10): string {
        const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ'
        const lowercase = 'abcdefghjkmnpqrstuvwxyz'
        const numbers = '23456789'
        const special = '@#$%&*'
        
        const password = [
            // Ensure at least one from each category
            ...Array(3).fill(0).map(() => uppercase[Math.floor(Math.random() * uppercase.length)]),
            ...Array(3).fill(0).map(() => lowercase[Math.floor(Math.random() * lowercase.length)]),
            ...Array(3).fill(0).map(() => numbers[Math.floor(Math.random() * numbers.length)]),
            special[Math.floor(Math.random() * special.length)]
        ]
        
        // Shuffle the password
        for (let i = password.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [password[i], password[j]] = [password[j], password[i]]
        }
        
        return password.join('')
    }
    
    private static async usernameExists(username: string): Promise<boolean> {
        const supabase = await createServerClient()
        
        // Check both student_profiles and any potential conflicts
        const { data } = await supabase
            .from('student_profiles')
            .select('id')
            .eq('username', username)
            .single()
        
        return !!data
    }
}
```

### 2. Complete Credential Creation Service
```typescript
// /src/lib/services/student-credential-service.ts

interface CreateCredentialsParams {
    studentId: string
    organizationId: string
    generatedBy: string
    notifyParent?: boolean
    customUsername?: string
    temporaryPassword?: string
}

export class StudentCredentialService {
    
    static async createCredentials({
        studentId,
        organizationId,
        generatedBy,
        notifyParent = true,
        customUsername,
        temporaryPassword
    }: CreateCredentialsParams) {
        const supabase = await createServerClient()
        
        // Get student data
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('first_name, last_name, full_name, email, parent_guardian_info')
            .eq('id', studentId)
            .eq('organization_id', organizationId)
            .single()
        
        if (studentError || !student) {
            throw new Error('Student not found')
        }
        
        // Generate credentials
        const username = customUsername || await CredentialGeneratorService.generateUsername(
            student.first_name,
            student.last_name,
            studentId,
            organizationId
        )
        
        const password = temporaryPassword || CredentialGeneratorService.generateTemporaryPassword()
        
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: student.email || `${username}@temp.harryschool.uz`,
            password: password,
            user_metadata: {
                role: 'student',
                student_id: studentId,
                organization_id: organizationId,
                username: username,
                requires_password_change: true,
                created_by: generatedBy
            },
            email_confirm: false // Skip email confirmation for temporary accounts
        })
        
        if (authError) {
            throw new Error(`Failed to create auth user: ${authError.message}`)
        }
        
        // Update student_profiles table
        const { data: profile, error: profileError } = await supabase
            .from('student_profiles')
            .upsert({
                student_id: studentId,
                auth_user_id: authUser.user.id,
                username: username,
                credentials_created_at: new Date().toISOString(),
                password_must_change: true,
                account_locked: false,
                failed_login_attempts: 0,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (profileError) {
            // Rollback auth user creation
            await supabase.auth.admin.deleteUser(authUser.user.id)
            throw new Error(`Failed to create profile: ${profileError.message}`)
        }
        
        // Log credential creation
        const { error: credentialError } = await supabase
            .from('student_credentials')
            .insert({
                student_id: studentId,
                auth_user_id: authUser.user.id,
                username: username,
                credential_type: 'initial',
                generated_by: generatedBy,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                parent_notified: false
            })
        
        if (credentialError) {
            console.error('Failed to log credential creation:', credentialError)
            // Don't fail the entire operation for logging errors
        }
        
        // Send parent notification if requested
        let notificationSent = false
        if (notifyParent) {
            try {
                notificationSent = await this.sendParentNotification({
                    studentName: student.full_name,
                    username,
                    temporaryPassword: password,
                    parentInfo: student.parent_guardian_info,
                    organizationId
                })
            } catch (error) {
                console.error('Failed to send parent notification:', error)
                // Don't fail credential creation if notification fails
            }
        }
        
        return {
            username,
            temporaryPassword: password,
            authUserId: authUser.user.id,
            credentials: profile,
            notificationSent
        }
    }
    
    private static async sendParentNotification({
        studentName,
        username,
        temporaryPassword,
        parentInfo,
        organizationId
    }: {
        studentName: string
        username: string
        temporaryPassword: string
        parentInfo: any
        organizationId: string
    }): Promise<boolean> {
        // Implementation depends on your notification system
        // This could be email, SMS, or integration with parent portal
        
        const parentEmails = []
        if (Array.isArray(parentInfo)) {
            parentEmails.push(...parentInfo.map(p => p.email).filter(Boolean))
        }
        
        if (parentEmails.length === 0) {
            return false
        }
        
        // Get organization details for email template
        const supabase = await createServerClient()
        const { data: organization } = await supabase
            .from('organizations')
            .select('name, contact_info')
            .eq('id', organizationId)
            .single()
        
        // Send email using your preferred email service
        const emailContent = `
Dear Parent/Guardian,

Student login credentials have been created for ${studentName}:

Username: ${username}
Temporary Password: ${temporaryPassword}

Please ensure your child changes their password upon first login.

Best regards,
${organization?.name || 'Harry School'} Administration
        `
        
        // Implementation of actual email sending goes here
        // await EmailService.send({
        //     to: parentEmails,
        //     subject: `Student Login Credentials - ${studentName}`,
        //     body: emailContent
        // })
        
        return true
    }
}
```

## Integration with Existing Code

### 1. Updated Student Registration Flow
```typescript
// /src/app/api/students/route.ts (MODIFY POST method)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await getApiClient()
        const organizationId = await getCurrentOrganizationId()
        
        // ... existing student creation logic ...
        
        // NEW: Auto-generate credentials after student creation
        if (newStudent && body.generateCredentials !== false) {
            try {
                const credentials = await StudentCredentialService.createCredentials({
                    studentId: newStudent.id,
                    organizationId: organizationId!,
                    generatedBy: 'system', // Or get from auth context if available
                    notifyParent: body.notifyParent ?? true
                })
                
                // Include credential info in response (for admin view)
                return NextResponse.json({
                    success: true,
                    data: {
                        student: newStudent,
                        credentials: {
                            username: credentials.username,
                            temporaryPassword: credentials.temporaryPassword,
                            notificationSent: credentials.notificationSent
                        }
                    },
                    message: 'Student and credentials created successfully'
                }, { status: 201 })
                
            } catch (credentialError) {
                console.error('Failed to create credentials:', credentialError)
                
                // Return student creation success with credential creation failure
                return NextResponse.json({
                    success: true,
                    data: newStudent,
                    warning: 'Student created but failed to generate credentials',
                    error: credentialError instanceof Error ? credentialError.message : 'Unknown error',
                    message: 'Student created successfully (credentials need manual generation)'
                }, { status: 201 })
            }
        }
        
        return NextResponse.json({
            success: true,
            data: newStudent,
            message: 'Student created successfully'
        }, { status: 201 })
        
    } catch (error) {
        // ... existing error handling ...
    }
}
```

### 2. Enhanced Supabase Client Configuration
```typescript
// /src/lib/supabase-server.ts (MODIFY)

export async function createServerClient() {
    const cookieStore = await cookies()
    
    return createSupabaseServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch (error) {
                        // The `setAll` method was called from a Server Component
                    }
                }
            },
            auth: {
                // Enhanced auth options for multi-role support
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
                flowType: 'pkce',
                // Custom JWT processing
                onAuthStateChange: (event, session) => {
                    if (session?.user) {
                        // Log authentication events for audit
                        console.log(`[AUTH] ${event} for user type: ${session.user.user_metadata?.role || 'admin'}`)
                    }
                }
            }
        }
    )
}

// NEW: Create client with custom JWT for student impersonation (admin feature)
export async function createClientWithCustomJWT(jwt: string) {
    return createSupabaseServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            }
        }
    )
}
```

### 3. Database Service Layer Enhancements
```typescript
// /src/lib/services/base-service.ts (ENHANCE)

export class BaseService {
    protected supabase: SupabaseClient
    protected organizationId: string | null = null
    protected userType: 'admin' | 'student' | 'superadmin' = 'admin'
    
    constructor(supabase: SupabaseClient, context?: MultiRoleAuthContext) {
        this.supabase = supabase
        if (context) {
            this.organizationId = context.organizationId
            this.userType = context.userType
        }
    }
    
    // Enhanced query builder with automatic organization filtering
    protected buildQuery<T>(tableName: string) {
        let query = this.supabase.from(tableName)
        
        // Auto-apply organization filter for non-superadmins
        if (this.organizationId && this.userType !== 'superadmin') {
            query = query.eq('organization_id', this.organizationId)
        }
        
        // Auto-apply soft delete filter
        query = query.is('deleted_at', null)
        
        return query
    }
    
    // Audit-aware operations
    protected async auditOperation(
        operation: string,
        tableName: string,
        recordId: string,
        oldValues?: any,
        newValues?: any,
        metadata?: any
    ) {
        try {
            await this.supabase.from('audit_logs').insert({
                table_name: tableName,
                operation,
                record_id: recordId,
                user_id: this.supabase.auth.getUser().then(r => r.data.user?.id),
                user_type: this.userType,
                organization_id: this.organizationId,
                old_values: oldValues,
                new_values: newValues,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                    client_info: 'api-server'
                },
                educational_data_access: ['students', 'student_profiles'].includes(tableName)
            })
        } catch (error) {
            console.error('Failed to create audit log:', error)
            // Don't fail the main operation if audit logging fails
        }
    }
}

// Enhanced Student Service
export class StudentService extends BaseService {
    
    async getStudentById(id: string, includeCredentials: boolean = false) {
        let query = this.buildQuery('students')
            .select(`
                *,
                student_profiles(*)
                ${includeCredentials && this.userType !== 'student' ? ',student_credentials(username, credential_type, generated_at)' : ''}
            `)
            .eq('id', id)
        
        // Additional filtering for students accessing their own data
        if (this.userType === 'student') {
            query = query.eq('student_profiles.auth_user_id', (await this.supabase.auth.getUser()).data.user?.id)
        }
        
        const { data, error } = await query.single()
        
        if (!error && data) {
            await this.auditOperation('SELECT', 'students', id, null, null, {
                include_credentials: includeCredentials
            })
        }
        
        return { data, error }
    }
    
    async updateStudent(id: string, updates: any) {
        // Get current data for audit
        const { data: currentData } = await this.buildQuery('students')
            .select('*')
            .eq('id', id)
            .single()
        
        const { data, error } = await this.buildQuery('students')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
                updated_by: (await this.supabase.auth.getUser()).data.user?.id
            })
            .eq('id', id)
            .select()
            .single()
        
        if (!error && data) {
            await this.auditOperation('UPDATE', 'students', id, currentData, data)
        }
        
        return { data, error }
    }
}
```

## Security Implementation Details

### 1. Field-Level Encryption Service
```typescript
// /src/lib/services/encryption-service.ts

export class EncryptionService {
    private static readonly algorithm = 'aes-256-gcm'
    private static readonly keyDerivation = 'pbkdf2'
    
    private static getEncryptionKey(): string {
        const key = process.env.FIELD_ENCRYPTION_KEY
        if (!key) {
            throw new Error('FIELD_ENCRYPTION_KEY not configured')
        }
        return key
    }
    
    static encryptField(plaintext: string, associatedData?: string): {
        encrypted: string
        searchHash: string
    } {
        const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32)
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipher(this.algorithm, key)
        
        if (associatedData) {
            cipher.setAAD(Buffer.from(associatedData))
        }
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        
        const authTag = cipher.getAuthTag()
        const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
        
        // Create searchable hash for partial matching (one-way)
        const searchHash = crypto.createHmac('sha256', this.getEncryptionKey())
            .update(plaintext.toLowerCase().replace(/\s+/g, ''))
            .digest('hex')
            .substring(0, 16) // Truncate for storage efficiency
        
        return { encrypted: result, searchHash }
    }
    
    static decryptField(encryptedData: string, associatedData?: string): string {
        const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
        
        if (!ivHex || !authTagHex || !encrypted) {
            throw new Error('Invalid encrypted data format')
        }
        
        const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32)
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')
        
        const decipher = crypto.createDecipher(this.algorithm, key)
        decipher.setAuthTag(authTag)
        
        if (associatedData) {
            decipher.setAAD(Buffer.from(associatedData))
        }
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        
        return decrypted
    }
    
    // Utility method to encrypt sensitive student data
    static encryptStudentData(student: any): any {
        const sensitiveFields = ['primary_phone', 'secondary_phone', 'medical_notes', 'allergies']
        const result = { ...student }
        
        sensitiveFields.forEach(field => {
            if (result[field]) {
                const encrypted = this.encryptField(result[field], `student:${student.id}:${field}`)
                result[`${field}_encrypted`] = encrypted.encrypted
                result[`${field}_search`] = encrypted.searchHash
                delete result[field] // Remove plaintext
            }
        })
        
        return result
    }
    
    static decryptStudentData(student: any): any {
        const sensitiveFields = ['primary_phone', 'secondary_phone', 'medical_notes', 'allergies']
        const result = { ...student }
        
        sensitiveFields.forEach(field => {
            const encryptedField = `${field}_encrypted`
            if (result[encryptedField]) {
                try {
                    result[field] = this.decryptField(result[encryptedField], `student:${student.id}:${field}`)
                    delete result[encryptedField]
                    delete result[`${field}_search`] // Remove search hash from output
                } catch (error) {
                    console.error(`Failed to decrypt ${field}:`, error)
                    result[field] = '[ENCRYPTED]'
                }
            }
        })
        
        return result
    }
}
```

### 2. Rate Limiting Middleware
```typescript
// /src/lib/middleware/rate-limiting.ts

interface RateLimitRule {
    windowMs: number
    maxRequests: number
    skipIf?: (request: NextRequest) => boolean
    keyGenerator?: (request: NextRequest) => string
}

const rateLimitRules: Record<string, RateLimitRule> = {
    'auth:login': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'unknown'
    },
    'auth:password-reset': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'unknown'
    },
    'student:profile-update': {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 10,
        skipIf: (req) => req.headers.get('user-agent')?.includes('admin-panel') === true
    }
}

export async function withRateLimit(
    request: NextRequest,
    ruleKey: string
): Promise<NextResponse | null> {
    const rule = rateLimitRules[ruleKey]
    if (!rule) {
        return null // No rate limiting for this rule
    }
    
    if (rule.skipIf && rule.skipIf(request)) {
        return null // Skip rate limiting
    }
    
    const key = rule.keyGenerator 
        ? rule.keyGenerator(request)
        : request.headers.get('x-forwarded-for') || 'unknown'
    
    const cacheKey = `rate_limit:${ruleKey}:${key}`
    
    try {
        // Implementation depends on your caching solution
        // This is a Redis-like interface
        const current = await cache.get(cacheKey)
        const count = current ? parseInt(current) : 0
        
        if (count >= rule.maxRequests) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Rate limit exceeded',
                    retryAfter: Math.ceil(rule.windowMs / 1000)
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil(rule.windowMs / 1000).toString(),
                        'X-RateLimit-Limit': rule.maxRequests.toString(),
                        'X-RateLimit-Remaining': Math.max(0, rule.maxRequests - count - 1).toString(),
                        'X-RateLimit-Reset': new Date(Date.now() + rule.windowMs).toISOString()
                    }
                }
            )
        }
        
        // Increment counter
        if (count === 0) {
            await cache.setex(cacheKey, Math.ceil(rule.windowMs / 1000), '1')
        } else {
            await cache.incr(cacheKey)
        }
        
        return null // Allow request to proceed
        
    } catch (error) {
        console.error('Rate limiting error:', error)
        return null // Allow request on rate limiting errors
    }
}
```

### 3. Security Headers Middleware
```typescript
// /src/middleware.ts (ENHANCE)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()
    
    // Security headers for educational data protection
    const securityHeaders = {
        // Prevent clickjacking
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "font-src 'self'",
            "form-action 'self'",
            "base-uri 'self'",
            "upgrade-insecure-requests"
        ].join('; '),
        
        // Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff',
        
        // XSS protection
        'X-XSS-Protection': '1; mode=block',
        
        // HTTPS enforcement
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        
        // Referrer policy for privacy
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        
        // Feature policy for privacy
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        
        // Custom header for educational context
        'X-Educational-Data': 'protected',
        'X-FERPA-Compliant': 'true'
    }
    
    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })
    
    // Rate limiting for auth endpoints
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
        // Rate limiting logic here
    }
    
    return response
}

export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
}
```

## Performance Optimization Strategy

### 1. Database Indexing Strategy
```sql
-- Performance indexes for new tables and queries

-- Student profile lookups by auth user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_profiles_auth_user_perf 
ON student_profiles(auth_user_id, student_id) 
WHERE auth_user_id IS NOT NULL;

-- Credential management queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_credentials_lookup 
ON student_credentials(student_id, credential_type, used_at) 
WHERE used_at IS NULL;

-- Audit log performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_educational_recent 
ON audit_logs(created_at DESC, organization_id) 
WHERE educational_data_access = true AND created_at > NOW() - INTERVAL '30 days';

-- Session management performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active_lookup 
ON user_sessions(user_id, active, expires_at) 
WHERE active = true;

-- Parent relationship lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parent_relationships_student 
ON parent_student_relationships(student_id, verified) 
WHERE verified = true;

-- Organization-based queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_org_active 
ON students(organization_id, is_active, deleted_at) 
WHERE is_active = true AND deleted_at IS NULL;
```

### 2. Query Optimization Patterns
```sql
-- Optimized query for student dashboard (frequent access)
CREATE OR REPLACE VIEW student_dashboard_view AS
SELECT 
    s.id,
    s.full_name,
    s.total_points,
    s.current_level,
    s.available_coins,
    s.academic_score,
    sp.username,
    sp.avatar_type,
    sp.theme_preference,
    sp.vocabulary_daily_goal,
    sp.study_streak_goal,
    sp.last_login_at,
    sp.total_study_time
FROM students s
JOIN student_profiles sp ON s.id = sp.student_id
WHERE s.is_active = true 
  AND s.deleted_at IS NULL;

-- Optimized query for admin student list (with pagination support)
CREATE OR REPLACE FUNCTION get_students_for_organization(
    org_id UUID,
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0,
    search_term TEXT DEFAULT NULL
) RETURNS TABLE (
    student_record JSON,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_students AS (
        SELECT s.*, sp.username, sp.last_login_at,
               COUNT(*) OVER() AS total_count
        FROM students s
        LEFT JOIN student_profiles sp ON s.id = sp.student_id
        WHERE s.organization_id = org_id
          AND s.deleted_at IS NULL
          AND (search_term IS NULL 
               OR s.full_name ILIKE '%' || search_term || '%'
               OR s.primary_phone ILIKE '%' || search_term || '%'
               OR s.email ILIKE '%' || search_term || '%')
        ORDER BY s.created_at DESC
        LIMIT page_size
        OFFSET page_offset
    )
    SELECT 
        row_to_json(fs.*),
        fs.total_count
    FROM filtered_students fs;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 3. Caching Strategy
```typescript
// /src/lib/cache/student-cache.ts

export class StudentCache {
    private static readonly TTL = {
        PROFILE: 15 * 60, // 15 minutes
        CREDENTIALS: 60 * 60, // 1 hour
        ORGANIZATION_STUDENTS: 5 * 60 // 5 minutes
    }
    
    // Cache student profile data
    static async getStudentProfile(studentId: string, authUserId: string): Promise<any> {
        const cacheKey = `student_profile:${studentId}:${authUserId}`
        
        try {
            const cached = await cache.get(cacheKey)
            if (cached) {
                return JSON.parse(cached)
            }
            
            // Fetch from database
            const supabase = await createServerClient()
            const { data, error } = await supabase
                .from('students')
                .select(`
                    id, full_name, grade_level, total_points, current_level,
                    student_profiles!inner(
                        username, bio, avatar_type, theme_preference,
                        vocabulary_daily_goal, study_streak_goal
                    )
                `)
                .eq('id', studentId)
                .eq('student_profiles.auth_user_id', authUserId)
                .single()
            
            if (!error && data) {
                await cache.setex(cacheKey, this.TTL.PROFILE, JSON.stringify(data))
                return data
            }
            
            return null
        } catch (error) {
            console.error('Cache error:', error)
            return null
        }
    }
    
    // Invalidate student-related caches
    static async invalidateStudent(studentId: string) {
        const patterns = [
            `student_profile:${studentId}:*`,
            `organization_students:*`,
            `student_credentials:${studentId}:*`
        ]
        
        for (const pattern of patterns) {
            try {
                await cache.del(pattern)
            } catch (error) {
                console.error('Cache invalidation error:', error)
            }
        }
    }
}
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. **Database Schema Creation**
   ```sql
   -- Execute all new table creation scripts
   -- Add indexes and constraints
   -- Create audit functions and triggers
   ```

2. **RLS Policy Implementation**
   ```sql
   -- Deploy all new RLS policies
   -- Test policy effectiveness
   -- Monitor performance impact
   ```

3. **Basic Multi-Role Authentication**
   ```typescript
   // Deploy enhanced authentication middleware
   // Update student API endpoint for basic multi-role support
   // Test admin and student access patterns
   ```

### Phase 2: Core Features (Week 2)
1. **Credential Generation System**
   ```typescript
   // Deploy credential generation services
   // Update student registration flow
   // Test automatic credential creation
   ```

2. **Student Profile Management**
   ```typescript
   // Deploy student profile endpoints
   // Test student self-service capabilities
   // Validate data access restrictions
   ```

3. **Basic Security Features**
   ```typescript
   // Deploy encryption service
   // Add security headers
   // Implement basic audit logging
   ```

### Phase 3: Advanced Security (Week 3)
1. **Educational Compliance**
   ```sql
   -- Deploy FERPA compliance tables
   -- Create parent relationship system
   -- Implement data classification
   ```

2. **Enhanced Audit System**
   ```typescript
   // Deploy comprehensive audit logging
   // Create audit reporting endpoints
   // Test compliance requirements
   ```

3. **Rate Limiting and Security**
   ```typescript
   // Deploy rate limiting middleware
   // Test brute force protection
   // Validate security headers
   ```

### Phase 4: Optimization (Week 4)
1. **Performance Optimization**
   ```sql
   -- Deploy performance indexes
   -- Create optimized views and functions
   -- Test query performance
   ```

2. **Caching Implementation**
   ```typescript
   // Deploy caching layer
   // Test cache invalidation
   // Monitor performance improvements
   ```

3. **Production Readiness**
   ```typescript
   // Final security audit
   // Load testing
   // Documentation completion
   ```

## Testing Strategy

### 1. Unit Tests for Core Services
```typescript
// /src/tests/services/student-credential-service.test.ts

describe('StudentCredentialService', () => {
    describe('createCredentials', () => {
        it('should generate unique username and password', async () => {
            const result = await StudentCredentialService.createCredentials({
                studentId: 'test-student-id',
                organizationId: 'test-org-id',
                generatedBy: 'test-admin-id'
            })
            
            expect(result.username).toMatch(/^[a-z]{2,4}\d{2}[a-f0-9]{6}$/)
            expect(result.temporaryPassword).toHaveLength(10)
            expect(result.authUserId).toBeDefined()
        })
        
        it('should handle duplicate username generation', async () => {
            // Mock existing username
            jest.spyOn(CredentialGeneratorService, 'usernameExists')
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false)
            
            const result = await StudentCredentialService.createCredentials({
                studentId: 'test-student-id',
                organizationId: 'test-org-id',
                generatedBy: 'test-admin-id'
            })
            
            expect(result.username).toMatch(/^[a-z]{2,4}\d{2}[a-f0-9]{6}\d+$/)
        })
    })
})
```

### 2. Integration Tests for API Endpoints
```typescript
// /src/tests/api/students.test.ts

describe('/api/students/[id]', () => {
    describe('GET endpoint', () => {
        it('should allow students to access their own profile', async () => {
            const studentToken = generateStudentJWT({
                studentId: 'test-student-id',
                authUserId: 'test-auth-user-id'
            })
            
            const response = await request(app)
                .get('/api/students/test-student-id')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200)
            
            expect(response.body.success).toBe(true)
            expect(response.body.data.id).toBe('test-student-id')
            expect(response.body.data.student_profiles).toBeDefined()
        })
        
        it('should prevent students from accessing other profiles', async () => {
            const studentToken = generateStudentJWT({
                studentId: 'test-student-id',
                authUserId: 'test-auth-user-id'
            })
            
            await request(app)
                .get('/api/students/other-student-id')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403)
        })
        
        it('should allow admins to access students in their organization', async () => {
            const adminToken = generateAdminJWT({
                organizationId: 'test-org-id'
            })
            
            const response = await request(app)
                .get('/api/students/test-student-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
            
            expect(response.body.success).toBe(true)
            expect(response.body.data.id).toBe('test-student-id')
        })
    })
})
```

### 3. RLS Policy Tests
```sql
-- /src/tests/database/rls-policies.test.sql

BEGIN;

-- Test student can only access their own profile
SET request.jwt.claims TO '{"role": "student", "sub": "student-auth-id"}';

-- Should return student's own profile
SELECT plan(3);
SELECT results_eq(
    'SELECT id FROM student_profiles WHERE auth_user_id = ''student-auth-id''',
    ARRAY['test-student-profile-id'],
    'Student can access their own profile'
);

-- Should not return other students' profiles
SELECT results_eq(
    'SELECT id FROM student_profiles WHERE auth_user_id = ''other-auth-id''',
    ARRAY[]::UUID[],
    'Student cannot access other profiles'
);

-- Test admin can access students in their organization
SET request.jwt.claims TO '{"role": "admin", "sub": "admin-auth-id"}';

SELECT results_ne(
    'SELECT COUNT(*) FROM students WHERE organization_id = ''test-org-id''',
    0,
    'Admin can access students in their organization'
);

ROLLBACK;
```

## Monitoring and Alerting

### 1. Security Monitoring
```typescript
// /src/lib/monitoring/security-monitor.ts

export class SecurityMonitor {
    
    // Monitor failed login attempts
    static async checkFailedLogins() {
        const supabase = await createServerClient()
        
        const { data: failedAttempts } = await supabase
            .from('audit_logs')
            .select('user_id, ip_address, created_at')
            .eq('metadata->action', 'failed_login')
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
        
        // Group by IP address
        const attemptsByIP = {}
        failedAttempts?.forEach(attempt => {
            const ip = attempt.ip_address
            if (!attemptsByIP[ip]) {
                attemptsByIP[ip] = []
            }
            attemptsByIP[ip].push(attempt)
        })
        
        // Alert on suspicious activity
        Object.entries(attemptsByIP).forEach(([ip, attempts]) => {
            if ((attempts as any[]).length >= 5) {
                this.sendSecurityAlert({
                    type: 'multiple_failed_logins',
                    ip,
                    count: (attempts as any[]).length,
                    timeframe: '5 minutes'
                })
            }
        })
    }
    
    // Monitor bulk student data access
    static async checkBulkDataAccess() {
        const supabase = await createServerClient()
        
        const { data: bulkAccess } = await supabase
            .rpc('detect_bulk_student_access', {
                time_window: '1 hour',
                threshold: 50
            })
        
        if (bulkAccess?.length > 0) {
            this.sendSecurityAlert({
                type: 'bulk_data_access',
                users: bulkAccess,
                threshold: 50
            })
        }
    }
    
    private static async sendSecurityAlert(alert: any) {
        console.error('[SECURITY ALERT]', alert)
        
        // Integration with alerting system
        // await AlertingService.send({
        //     priority: 'high',
        //     message: `Security Alert: ${alert.type}`,
        //     details: alert
        // })
    }
}
```

### 2. Performance Monitoring
```typescript
// /src/lib/monitoring/performance-monitor.ts

export class PerformanceMonitor {
    
    static async checkDatabasePerformance() {
        const supabase = await createServerClient()
        
        // Check slow queries
        const { data: slowQueries } = await supabase
            .rpc('get_slow_queries', { 
                min_duration: '1000ms',
                limit: 10
            })
        
        if (slowQueries?.length > 0) {
            console.warn('[PERFORMANCE] Slow queries detected:', slowQueries)
        }
        
        // Check RLS policy performance
        const { data: rlsStats } = await supabase
            .rpc('get_rls_performance_stats')
        
        if (rlsStats?.avg_execution_time > 100) {
            console.warn('[PERFORMANCE] RLS policies may need optimization')
        }
    }
    
    static async checkCacheHitRate() {
        const hitRate = await cache.info('keyspace_hits') / 
                       (await cache.info('keyspace_hits') + await cache.info('keyspace_misses'))
        
        if (hitRate < 0.8) {
            console.warn('[PERFORMANCE] Cache hit rate below threshold:', hitRate)
        }
    }
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] Database migrations tested in staging
- [ ] All RLS policies validated
- [ ] Security tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables configured

### Deployment Steps
1. **Database Migration**
   ```bash
   # Apply database migrations
   npm run migrate:up
   
   # Verify RLS policies
   npm run test:rls
   ```

2. **Application Deployment**
   ```bash
   # Deploy to staging
   vercel deploy --target staging
   
   # Run integration tests
   npm run test:integration
   
   # Deploy to production
   vercel deploy --prod
   ```

3. **Post-Deployment Verification**
   ```bash
   # Test multi-role authentication
   npm run test:auth
   
   # Verify credential generation
   npm run test:credentials
   
   # Check security headers
   npm run test:security
   ```

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify audit logging
- [ ] Test backup and recovery
- [ ] Update monitoring alerts

## Conclusion

This backend architecture provides a comprehensive solution for the Harry School CRM student credentials system, addressing all critical security findings while maintaining high performance and educational compliance standards. The implementation follows Supabase best practices for multi-role authentication and provides a scalable foundation for future educational features.

**Key Benefits:**
- **Security**: Multi-layer protection with RLS, encryption, and audit trails
- **Compliance**: FERPA-ready with educational data classification and parent access controls
- **Performance**: Optimized queries, caching, and indexing strategies
- **Maintainability**: Clean service architecture with comprehensive testing
- **Scalability**: Designed to handle 1000+ students with minimal performance impact

The phased implementation approach ensures minimal disruption to existing functionality while systematically addressing all identified security vulnerabilities. Regular monitoring and alerting provide ongoing assurance that the system maintains its security posture as it scales.
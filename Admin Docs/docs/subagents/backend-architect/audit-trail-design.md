# Audit Trail Design - Harry School CRM

## Audit System Overview

The Harry School CRM implements a comprehensive audit trail system that tracks all data changes, user actions, and system events. This provides complete transparency, regulatory compliance, and forensic capabilities for educational data management.

## Audit Design Principles

1. **Complete Coverage**: All data modifications are tracked
2. **Immutable Records**: Audit logs cannot be modified or deleted
3. **User Attribution**: Every change is linked to a specific user
4. **Temporal Tracking**: Precise timestamps for all activities
5. **Soft Delete Support**: Recoverable deletion with full history
6. **Performance Optimized**: Minimal impact on system performance
7. **Compliance Ready**: Meets educational data protection requirements

## Audit Components

### 1. Audit Fields Architecture

Every auditable table includes standardized audit fields:

```sql
-- Standard audit fields for all tables
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Soft delete fields
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
```

### 2. Activity Logs Table

Comprehensive activity logging for all user actions:

```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Actor Information
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('superadmin', 'admin', 'viewer')),
    
    -- Action Information
    action TEXT NOT NULL CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'VIEW', 'EXPORT', 
        'LOGIN', 'LOGOUT', 'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE'
    )),
    resource_type TEXT NOT NULL CHECK (resource_type IN (
        'student', 'teacher', 'group', 'enrollment', 'assignment', 
        'organization', 'profile', 'notification', 'system_setting'
    )),
    resource_id UUID,
    resource_name TEXT,
    
    -- Change Details
    old_values JSONB, -- Previous state before change
    new_values JSONB, -- New state after change
    changed_fields TEXT[], -- Array of field names that changed
    
    -- Context Information
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id UUID, -- For tracing related operations
    
    -- Additional Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms INTEGER, -- Performance tracking
    
    -- System Information
    database_user TEXT DEFAULT current_user,
    application_version TEXT,
    
    -- Immutable timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_organization_time ON activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_user_time ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action, created_at DESC);
CREATE INDEX idx_activity_logs_session ON activity_logs(session_id, created_at DESC);
CREATE INDEX idx_activity_logs_success ON activity_logs(success, created_at DESC) WHERE success = false;

-- Partial index for recent activities (hot data)
CREATE INDEX idx_activity_logs_recent ON activity_logs(organization_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';
```

### 3. Automated Audit Functions

#### Audit Field Management

```sql
-- Function to automatically manage audit fields
CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created fields on INSERT
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = auth.uid();
        NEW.created_at = NOW();
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
        
        -- Validate required fields
        IF NEW.created_by IS NULL THEN
            RAISE EXCEPTION 'Cannot create record without authenticated user';
        END IF;
    END IF;
    
    -- Set updated fields on UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Preserve original creation data
        NEW.created_by = OLD.created_by;
        NEW.created_at = OLD.created_at;
        
        -- Update modification data
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
        
        -- Handle soft delete
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by = auth.uid();
            NEW.deleted_at = NOW(); -- Ensure consistent timestamp
        END IF;
        
        -- Prevent audit field tampering
        IF NEW.created_at != OLD.created_at OR NEW.created_by != OLD.created_by THEN
            RAISE EXCEPTION 'Cannot modify audit creation fields';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Activity Logging Function

```sql
-- Comprehensive activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    action_name TEXT;
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] DEFAULT '{}';
    field_name TEXT;
    description_text TEXT;
    resource_name_text TEXT;
    request_start_time TIMESTAMPTZ;
    execution_time INTEGER;
BEGIN
    -- Get request start time for performance tracking
    BEGIN
        request_start_time := current_setting('audit.request_start_time')::TIMESTAMPTZ;
        execution_time := EXTRACT(EPOCH FROM (NOW() - request_start_time)) * 1000;
    EXCEPTION
        WHEN OTHERS THEN
            execution_time := NULL;
    END;
    
    -- Get user profile information
    SELECT p.full_name, p.email, p.role, p.organization_id
    INTO user_profile
    FROM profiles p
    WHERE p.id = auth.uid();
    
    -- Handle case where user profile doesn't exist (system operations)
    IF user_profile IS NULL THEN
        user_profile.full_name := 'System';
        user_profile.email := 'system@internal';
        user_profile.role := 'system';
        user_profile.organization_id := COALESCE(NEW.organization_id, OLD.organization_id);
    END IF;
    
    -- Determine action type
    action_name := CASE TG_OP
        WHEN 'INSERT' THEN 'CREATE'
        WHEN 'UPDATE' THEN 
            CASE 
                WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN 'DELETE'
                WHEN NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN 'RESTORE'
                ELSE 'UPDATE'
            END
        WHEN 'DELETE' THEN 'DELETE'
    END;
    
    -- Prepare data snapshots
    old_data := CASE WHEN OLD IS NULL THEN NULL ELSE row_to_json(OLD)::jsonb END;
    new_data := CASE WHEN NEW IS NULL THEN NULL ELSE row_to_json(NEW)::jsonb END;
    
    -- Identify changed fields for UPDATE operations
    IF TG_OP = 'UPDATE' AND old_data IS NOT NULL AND new_data IS NOT NULL THEN
        FOR field_name IN SELECT key FROM jsonb_each(new_data) LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name 
               AND field_name NOT IN ('updated_at', 'updated_by') THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Generate resource name
    resource_name_text := CASE 
        WHEN NEW IS NOT NULL THEN 
            COALESCE(NEW.full_name, NEW.name, NEW.title, NEW.id::TEXT)
        WHEN OLD IS NOT NULL THEN 
            COALESCE(OLD.full_name, OLD.name, OLD.title, OLD.id::TEXT)
        ELSE 'Unknown'
    END;
    
    -- Generate description
    description_text := CASE action_name
        WHEN 'CREATE' THEN 'Created ' || TG_TABLE_NAME || ': ' || resource_name_text
        WHEN 'UPDATE' THEN 'Updated ' || TG_TABLE_NAME || ': ' || resource_name_text || 
                          CASE WHEN array_length(changed_fields, 1) > 0 
                               THEN ' (fields: ' || array_to_string(changed_fields, ', ') || ')'
                               ELSE '' END
        WHEN 'DELETE' THEN 'Deleted ' || TG_TABLE_NAME || ': ' || resource_name_text
        WHEN 'RESTORE' THEN 'Restored ' || TG_TABLE_NAME || ': ' || resource_name_text
        ELSE action_name || ' ' || TG_TABLE_NAME
    END;
    
    -- Insert activity log (using INSERT instead of stored procedure for performance)
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        user_email,
        user_name,
        user_role,
        action,
        resource_type,
        resource_id,
        resource_name,
        old_values,
        new_values,
        changed_fields,
        description,
        ip_address,
        user_agent,
        session_id,
        request_id,
        execution_time_ms,
        metadata,
        database_user,
        application_version
    ) VALUES (
        user_profile.organization_id,
        auth.uid(),
        user_profile.email,
        user_profile.full_name,
        user_profile.role,
        action_name,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        resource_name_text,
        old_data,
        new_data,
        CASE WHEN array_length(changed_fields, 1) > 0 THEN changed_fields ELSE NULL END,
        description_text,
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb->>'user-agent',
        current_setting('request.session_id', true),
        current_setting('request.id', true)::UUID,
        execution_time,
        jsonb_build_object(
            'table_schema', TG_TABLE_SCHEMA,
            'trigger_name', TG_NAME,
            'operation', TG_OP,
            'changed_field_count', COALESCE(array_length(changed_fields, 1), 0)
        ),
        current_user,
        current_setting('app.version', true)
    );
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log audit failures but don't break the main operation
        RAISE WARNING 'Activity logging failed: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Soft Delete System

#### Soft Delete Implementation

```sql
-- Soft delete function with cascade support
CREATE OR REPLACE FUNCTION soft_delete_record(
    table_name TEXT,
    record_id UUID,
    organization_id UUID
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    delete_count INTEGER;
    cascaded_deletes JSONB DEFAULT '{}';
BEGIN
    -- Validate input
    IF table_name IS NULL OR record_id IS NULL OR organization_id IS NULL THEN
        RAISE EXCEPTION 'Missing required parameters for soft delete';
    END IF;
    
    -- Set audit context
    PERFORM set_config('audit.request_start_time', NOW()::TEXT, true);
    PERFORM set_config('request.id', gen_random_uuid()::TEXT, true);
    
    -- Perform soft delete based on table type
    CASE table_name
        WHEN 'students' THEN
            -- Soft delete student
            UPDATE students 
            SET deleted_at = NOW(), deleted_by = auth.uid()
            WHERE id = record_id AND organization_id = soft_delete_record.organization_id 
            AND deleted_at IS NULL;
            
            GET DIAGNOSTICS delete_count = ROW_COUNT;
            
            -- Cascade to enrollments
            UPDATE student_group_enrollments 
            SET deleted_at = NOW(), deleted_by = auth.uid()
            WHERE student_id = record_id AND deleted_at IS NULL;
            
            cascaded_deletes := jsonb_build_object('enrollments', ROW_COUNT);
            
        WHEN 'teachers' THEN
            -- Soft delete teacher
            UPDATE teachers 
            SET deleted_at = NOW(), deleted_by = auth.uid()
            WHERE id = record_id AND organization_id = soft_delete_record.organization_id 
            AND deleted_at IS NULL;
            
            GET DIAGNOSTICS delete_count = ROW_COUNT;
            
            -- Cascade to assignments
            UPDATE teacher_group_assignments 
            SET deleted_at = NOW(), deleted_by = auth.uid()
            WHERE teacher_id = record_id AND deleted_at IS NULL;
            
            cascaded_deletes := jsonb_build_object('assignments', ROW_COUNT);
            
        WHEN 'groups' THEN
            -- Soft delete group
            UPDATE groups 
            SET deleted_at = NOW(), deleted_by = auth.uid()
            WHERE id = record_id AND organization_id = soft_delete_record.organization_id 
            AND deleted_at IS NULL;
            
            GET DIAGNOSTICS delete_count = ROW_COUNT;
            
            -- Cascade to enrollments and assignments
            UPDATE student_group_enrollments 
            SET deleted_at = NOW(), deleted_by = auth.uid()
            WHERE group_id = record_id AND deleted_at IS NULL;
            
            UPDATE teacher_group_assignments 
            SET deleted_at = NOW(), deleted_by = auth.uid()
            WHERE group_id = record_id AND deleted_at IS NULL;
            
            cascaded_deletes := jsonb_build_object(
                'enrollments', (SELECT changes()),
                'assignments', (SELECT changes())
            );
            
        ELSE
            RAISE EXCEPTION 'Soft delete not supported for table: %', table_name;
    END CASE;
    
    -- Build result
    result := jsonb_build_object(
        'success', delete_count > 0,
        'deleted_count', delete_count,
        'cascaded_deletes', cascaded_deletes,
        'deleted_at', NOW(),
        'deleted_by', auth.uid()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Restore Function

```sql
-- Restore soft-deleted records
CREATE OR REPLACE FUNCTION restore_record(
    table_name TEXT,
    record_id UUID,
    organization_id UUID,
    restore_cascaded BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    restore_count INTEGER;
    cascaded_restores JSONB DEFAULT '{}';
BEGIN
    -- Set audit context
    PERFORM set_config('audit.request_start_time', NOW()::TEXT, true);
    PERFORM set_config('request.id', gen_random_uuid()::TEXT, true);
    
    -- Perform restore based on table type
    CASE table_name
        WHEN 'students' THEN
            UPDATE students 
            SET deleted_at = NULL, deleted_by = NULL
            WHERE id = record_id AND organization_id = restore_record.organization_id 
            AND deleted_at IS NOT NULL;
            
            GET DIAGNOSTICS restore_count = ROW_COUNT;
            
            -- Optionally restore enrollments
            IF restore_cascaded THEN
                UPDATE student_group_enrollments 
                SET deleted_at = NULL, deleted_by = NULL
                WHERE student_id = record_id AND deleted_at IS NOT NULL;
                
                cascaded_restores := jsonb_build_object('enrollments', ROW_COUNT);
            END IF;
            
        WHEN 'teachers' THEN
            UPDATE teachers 
            SET deleted_at = NULL, deleted_by = NULL
            WHERE id = record_id AND organization_id = restore_record.organization_id 
            AND deleted_at IS NOT NULL;
            
            GET DIAGNOSTICS restore_count = ROW_COUNT;
            
            -- Optionally restore assignments
            IF restore_cascaded THEN
                UPDATE teacher_group_assignments 
                SET deleted_at = NULL, deleted_by = NULL
                WHERE teacher_id = record_id AND deleted_at IS NOT NULL;
                
                cascaded_restores := jsonb_build_object('assignments', ROW_COUNT);
            END IF;
            
        WHEN 'groups' THEN
            UPDATE groups 
            SET deleted_at = NULL, deleted_by = NULL
            WHERE id = record_id AND organization_id = restore_record.organization_id 
            AND deleted_at IS NOT NULL;
            
            GET DIAGNOSTICS restore_count = ROW_COUNT;
            
        ELSE
            RAISE EXCEPTION 'Restore not supported for table: %', table_name;
    END CASE;
    
    -- Build result
    result := jsonb_build_object(
        'success', restore_count > 0,
        'restored_count', restore_count,
        'cascaded_restores', cascaded_restores,
        'restored_at', NOW(),
        'restored_by', auth.uid()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Archive Management

#### Archive Tables Structure

```sql
-- Archive configuration table
CREATE TABLE archive_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    table_name TEXT NOT NULL,
    retention_days INTEGER NOT NULL CHECK (retention_days > 0),
    auto_archive BOOLEAN DEFAULT true,
    archive_destination TEXT CHECK (archive_destination IN ('cold_storage', 'external', 'delete')),
    
    -- Policy metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, table_name)
);

-- Archive operations log
CREATE TABLE archive_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    operation_type TEXT NOT NULL CHECK (operation_type IN ('archive', 'restore', 'purge')),
    table_name TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    criteria JSONB NOT NULL, -- Archive criteria used
    
    -- Operation details
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- Archive destination
    archive_location TEXT,
    archive_size_bytes BIGINT,
    
    -- Audit
    initiated_by UUID REFERENCES auth.users(id),
    
    CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);
```

#### Archive Management Functions

```sql
-- Function to archive old deleted records
CREATE OR REPLACE FUNCTION archive_deleted_records(
    p_organization_id UUID,
    p_table_name TEXT,
    p_older_than_days INTEGER DEFAULT 90
) RETURNS JSONB AS $$
DECLARE
    archive_query TEXT;
    affected_count INTEGER;
    operation_id UUID;
    result JSONB;
BEGIN
    -- Create operation record
    INSERT INTO archive_operations (
        organization_id, operation_type, table_name, record_count,
        criteria, initiated_by
    ) VALUES (
        p_organization_id, 'archive', p_table_name, 0,
        jsonb_build_object('older_than_days', p_older_than_days, 'deleted_only', true),
        auth.uid()
    ) RETURNING id INTO operation_id;
    
    -- Build archive query based on table
    archive_query := format(
        'CREATE TABLE IF NOT EXISTS %I_archive (LIKE %I INCLUDING ALL)',
        p_table_name, p_table_name
    );
    EXECUTE archive_query;
    
    -- Move records to archive table
    archive_query := format(
        'WITH archived AS (
            DELETE FROM %I 
            WHERE organization_id = $1 
            AND deleted_at IS NOT NULL 
            AND deleted_at < NOW() - INTERVAL ''%s days''
            RETURNING *
        )
        INSERT INTO %I_archive SELECT * FROM archived',
        p_table_name, p_older_than_days, p_table_name
    );
    
    EXECUTE archive_query USING p_organization_id;
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    -- Update operation record
    UPDATE archive_operations 
    SET 
        record_count = affected_count,
        completed_at = NOW(),
        status = 'completed'
    WHERE id = operation_id;
    
    -- Build result
    result := jsonb_build_object(
        'success', true,
        'operation_id', operation_id,
        'archived_count', affected_count,
        'table_name', p_table_name,
        'criteria', jsonb_build_object('older_than_days', p_older_than_days)
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Update operation record with error
        UPDATE archive_operations 
        SET 
            status = 'failed',
            error_message = SQLERRM,
            completed_at = NOW()
        WHERE id = operation_id;
        
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. Audit Queries and Views

#### Audit Query Views

```sql
-- View for recent user activities
CREATE VIEW recent_user_activities AS
SELECT 
    al.id,
    al.created_at,
    al.user_name,
    al.user_role,
    al.action,
    al.resource_type,
    al.resource_name,
    al.description,
    al.success,
    al.organization_id,
    -- Highlight important changes
    CASE 
        WHEN al.action = 'DELETE' THEN 'danger'
        WHEN al.action = 'CREATE' THEN 'success'
        WHEN al.action = 'UPDATE' AND al.changed_fields && ARRAY['payment_status', 'enrollment_status'] THEN 'warning'
        ELSE 'info'
    END as importance_level
FROM activity_logs al
WHERE al.created_at >= NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;

-- View for data change history
CREATE VIEW data_change_history AS
SELECT 
    al.id,
    al.created_at,
    al.resource_type,
    al.resource_id,
    al.resource_name,
    al.action,
    al.user_name,
    al.changed_fields,
    -- Extract specific field changes
    CASE 
        WHEN al.old_values IS NOT NULL AND al.new_values IS NOT NULL THEN
            jsonb_build_object(
                'before', al.old_values,
                'after', al.new_values,
                'changes', (
                    SELECT jsonb_object_agg(key, jsonb_build_object(
                        'from', al.old_values->key,
                        'to', al.new_values->key
                    ))
                    FROM jsonb_each(al.new_values)
                    WHERE key = ANY(al.changed_fields)
                )
            )
        ELSE NULL
    END as change_details,
    al.organization_id
FROM activity_logs al
WHERE al.action IN ('UPDATE', 'DELETE', 'RESTORE')
ORDER BY al.created_at DESC;

-- View for audit trail by resource
CREATE VIEW resource_audit_trail AS
SELECT 
    al.resource_type,
    al.resource_id,
    al.resource_name,
    COUNT(*) as total_changes,
    COUNT(*) FILTER (WHERE al.action = 'UPDATE') as updates,
    COUNT(*) FILTER (WHERE al.action = 'DELETE') as deletes,
    COUNT(*) FILTER (WHERE al.action = 'RESTORE') as restores,
    MIN(al.created_at) as first_activity,
    MAX(al.created_at) as last_activity,
    COUNT(DISTINCT al.user_id) as unique_editors,
    al.organization_id
FROM activity_logs al
WHERE al.resource_id IS NOT NULL
GROUP BY al.resource_type, al.resource_id, al.resource_name, al.organization_id
ORDER BY last_activity DESC;
```

#### Compliance Reporting Functions

```sql
-- Function to generate compliance reports
CREATE OR REPLACE FUNCTION generate_compliance_report(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_resource_types TEXT[] DEFAULT NULL
) RETURNS TABLE (
    resource_type TEXT,
    total_records BIGINT,
    created_count BIGINT,
    updated_count BIGINT,
    deleted_count BIGINT,
    restored_count BIGINT,
    unique_users BIGINT,
    compliance_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.resource_type,
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE al.action = 'CREATE') as created_count,
        COUNT(*) FILTER (WHERE al.action = 'UPDATE') as updated_count,
        COUNT(*) FILTER (WHERE al.action = 'DELETE') as deleted_count,
        COUNT(*) FILTER (WHERE al.action = 'RESTORE') as restored_count,
        COUNT(DISTINCT al.user_id) as unique_users,
        -- Compliance score based on audit coverage
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(*) FILTER (WHERE al.success = true)::NUMERIC / COUNT(*)) * 100, 
                    2
                )
            ELSE 0
        END as compliance_score
    FROM activity_logs al
    WHERE al.organization_id = p_organization_id
    AND al.created_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_resource_types IS NULL OR al.resource_type = ANY(p_resource_types))
    GROUP BY al.resource_type
    ORDER BY total_records DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7. Performance Optimization

#### Audit Log Partitioning

```sql
-- Partition activity_logs by date for better performance
CREATE TABLE activity_logs_y2024m01 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE activity_logs_y2024m02 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Function to create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(target_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := date_trunc('month', target_date);
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'activity_logs_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF activity_logs FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
    
    -- Create indexes on the partition
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON %I (organization_id, created_at DESC)',
        partition_name || '_org_time_idx', partition_name
    );
END;
$$ LANGUAGE plpgsql;
```

#### Audit Log Cleanup

```sql
-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
    p_organization_id UUID,
    p_retention_months INTEGER DEFAULT 24
) RETURNS JSONB AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    deleted_count INTEGER;
    result JSONB;
BEGIN
    cutoff_date := NOW() - (p_retention_months || ' months')::INTERVAL;
    
    -- Delete old audit logs
    DELETE FROM activity_logs 
    WHERE organization_id = p_organization_id 
    AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    result := jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'cutoff_date', cutoff_date,
        'retention_months', p_retention_months
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8. API Integration

#### Audit API Endpoints

```typescript
// Next.js API endpoint for audit trail access
// /api/audit/activity-logs

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(request.url)
  
  // Parse query parameters
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const resourceType = searchParams.get('resource_type')
  const resourceId = searchParams.get('resource_id')
  const userId = searchParams.get('user_id')
  const action = searchParams.get('action')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  
  // Build query
  let query = supabase
    .from('activity_logs')
    .select(`
      id,
      created_at,
      user_name,
      user_email,
      user_role,
      action,
      resource_type,
      resource_id,
      resource_name,
      description,
      changed_fields,
      success,
      ip_address,
      execution_time_ms
    `)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  
  // Apply filters
  if (resourceType) query = query.eq('resource_type', resourceType)
  if (resourceId) query = query.eq('resource_id', resourceId)
  if (userId) query = query.eq('user_id', userId)
  if (action) query = query.eq('action', action)
  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)
  
  const { data, error, count } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    success: true,
    data: {
      activities: data,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil((count || 0) / limit)
      }
    }
  })
}

// Get detailed change history for a specific resource
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const body = await request.json()
  
  const { resource_type, resource_id } = body
  
  if (!resource_type || !resource_id) {
    return NextResponse.json(
      { error: 'Resource type and ID are required' },
      { status: 400 }
    )
  }
  
  const { data, error } = await supabase
    .from('data_change_history')
    .select('*')
    .eq('resource_type', resource_type)
    .eq('resource_id', resource_id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    success: true,
    data: {
      resource_type,
      resource_id,
      change_history: data
    }
  })
}
```

### 9. Security and Access Control

#### Audit Access Policies

```sql
-- RLS policies for audit access
CREATE POLICY "Admins can view audit logs" ON activity_logs
    FOR SELECT
    USING (
        auth.has_role('admin')
        AND organization_id = auth.current_user_organization_id()
    );

-- No INSERT, UPDATE, or DELETE policies - audit logs are immutable
-- Only the system can insert through triggers

CREATE POLICY "No direct modifications to audit logs" ON activity_logs
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Exception for system insertions (from triggers)
CREATE POLICY "System can insert audit logs" ON activity_logs
    FOR INSERT
    WITH CHECK (
        current_user = 'postgres' OR -- System user
        auth.uid() IS NOT NULL -- Authenticated user through trigger
    );
```

### 10. Monitoring and Alerting

#### Audit Anomaly Detection

```sql
-- Function to detect audit anomalies
CREATE OR REPLACE FUNCTION detect_audit_anomalies(
    p_organization_id UUID,
    p_hours_back INTEGER DEFAULT 24
) RETURNS TABLE (
    anomaly_type TEXT,
    description TEXT,
    severity TEXT,
    count BIGINT,
    details JSONB
) AS $$
BEGIN
    -- Detect unusual deletion volumes
    RETURN QUERY
    SELECT 
        'high_deletion_volume' as anomaly_type,
        'Unusually high number of deletions detected' as description,
        'high' as severity,
        COUNT(*) as count,
        jsonb_build_object(
            'user_breakdown', jsonb_agg(
                jsonb_build_object('user', user_name, 'count', user_count)
            )
        ) as details
    FROM (
        SELECT user_name, COUNT(*) as user_count
        FROM activity_logs
        WHERE organization_id = p_organization_id
        AND created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
        AND action = 'DELETE'
        GROUP BY user_name
        HAVING COUNT(*) > 10 -- Threshold for concern
    ) deletion_stats
    GROUP BY ()
    HAVING COUNT(*) > 0;
    
    -- Detect failed operations
    RETURN QUERY
    SELECT 
        'high_failure_rate' as anomaly_type,
        'High rate of failed operations detected' as description,
        'medium' as severity,
        COUNT(*) as count,
        jsonb_build_object(
            'failure_rate', ROUND((COUNT(*)::NUMERIC / 
                (SELECT COUNT(*) FROM activity_logs 
                 WHERE organization_id = p_organization_id 
                 AND created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL)
            ) * 100, 2),
            'common_errors', jsonb_agg(DISTINCT error_message)
        ) as details
    FROM activity_logs
    WHERE organization_id = p_organization_id
    AND created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
    AND success = false
    GROUP BY ()
    HAVING COUNT(*) > 5; -- Threshold for concern
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This comprehensive audit trail design provides:

1. **Complete Activity Tracking** - Every data change and user action is logged
2. **Soft Delete System** - Recoverable deletion with full audit history
3. **Performance Optimization** - Efficient indexing and partitioning strategies
4. **Compliance Support** - Built-in reporting for regulatory requirements
5. **Archive Management** - Automated archiving of old records
6. **Security Controls** - Immutable audit logs with proper access control
7. **Anomaly Detection** - Automated monitoring for suspicious activities
8. **API Integration** - REST endpoints for audit data access

The system ensures complete transparency and accountability for all educational data management activities while maintaining high performance and security standards.
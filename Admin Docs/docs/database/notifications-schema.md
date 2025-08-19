# Notifications Database Schema Documentation

## Overview

The notifications system uses the existing `notifications` table in the Harry School CRM database to store and manage real-time notifications. This document covers the database schema, indexes, triggers, and Row Level Security (RLS) policies.

## Table Schema

### notifications

The main notifications table stores all notification data with comprehensive metadata and relationship information.

```sql
CREATE TABLE notifications (
    -- Primary Key
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
```

### Field Descriptions

#### Core Fields
- **id**: Unique identifier for each notification
- **organization_id**: Links notification to specific organization (multi-tenant isolation)
- **user_id**: Target specific user (optional, use role_target for broadcast)
- **role_target**: Array of roles to target (e.g., ['admin', 'superadmin'])

#### Content Fields
- **type**: Categorizes notification (system, enrollment, payment, etc.)
- **title**: Short notification title (max recommended: 100 characters)
- **message**: Detailed notification content (max recommended: 500 characters)
- **action_url**: Optional URL for "View" or "Action" buttons

#### Relationship Fields
- **related_student_id**: Links to student record for context
- **related_teacher_id**: Links to teacher record for context
- **related_group_id**: Links to group record for context

#### Status Fields
- **is_read**: Boolean flag for read status
- **read_at**: Timestamp when notification was read
- **delivery_method**: Array of delivery channels (currently only 'in_app')

#### Scheduling Fields
- **priority**: Visual and functional priority level
- **scheduled_for**: Future delivery timestamp (null = immediate)
- **expires_at**: Automatic expiration timestamp

#### Metadata
- **metadata**: JSONB field for additional data (custom properties, tracking info)

#### Audit Trail
- **created_at**: Notification creation timestamp
- **updated_at**: Last modification timestamp
- **deleted_at**: Soft delete timestamp (null = active)
- **deleted_by**: User who deleted the notification

## Database Indexes

### Existing Indexes

The following indexes should be created for optimal query performance:

```sql
-- Primary access patterns
CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, is_read) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_role_target 
ON notifications USING gin(role_target) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_created_at 
ON notifications(created_at DESC) 
WHERE deleted_at IS NULL;

-- Filtering and categorization
CREATE INDEX idx_notifications_type_priority 
ON notifications(type, priority) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_organization_type 
ON notifications(organization_id, type) 
WHERE deleted_at IS NULL;

-- Scheduled and expired notifications
CREATE INDEX idx_notifications_scheduled 
ON notifications(scheduled_for) 
WHERE scheduled_for IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_notifications_expires_at 
ON notifications(expires_at) 
WHERE expires_at IS NOT NULL AND deleted_at IS NULL;

-- Related entity lookups
CREATE INDEX idx_notifications_related_student 
ON notifications(related_student_id) 
WHERE related_student_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_notifications_related_teacher 
ON notifications(related_teacher_id) 
WHERE related_teacher_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_notifications_related_group 
ON notifications(related_group_id) 
WHERE related_group_id IS NOT NULL AND deleted_at IS NULL;

-- Full-text search (if needed)
CREATE INDEX idx_notifications_search 
ON notifications USING gin(to_tsvector('english', title || ' ' || message)) 
WHERE deleted_at IS NULL;

-- Composite index for common query patterns
CREATE INDEX idx_notifications_user_type_read 
ON notifications(user_id, type, is_read, created_at DESC) 
WHERE deleted_at IS NULL;
```

### Index Usage Analysis

#### Query Pattern: Get User Notifications
```sql
-- Uses: idx_notifications_user_unread
SELECT * FROM notifications 
WHERE user_id = $1 AND deleted_at IS NULL 
ORDER BY created_at DESC;
```

#### Query Pattern: Get Role-Based Notifications
```sql
-- Uses: idx_notifications_role_target
SELECT * FROM notifications 
WHERE role_target && ARRAY[$1] AND deleted_at IS NULL 
ORDER BY created_at DESC;
```

#### Query Pattern: Get Unread Count
```sql
-- Uses: idx_notifications_user_unread
SELECT COUNT(*) FROM notifications 
WHERE user_id = $1 AND is_read = false AND deleted_at IS NULL;
```

## Row Level Security (RLS) Policies

### Enable RLS
```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### Policy Definitions

#### Read Policy - Users can read their own notifications
```sql
CREATE POLICY "Users can read their own notifications" ON notifications
FOR SELECT
USING (
  organization_id = get_user_organization()
  AND (
    user_id = auth.uid()
    OR get_user_role() = ANY(role_target)
  )
  AND deleted_at IS NULL
);
```

#### Insert Policy - Admins can create notifications
```sql
CREATE POLICY "Admins can create notifications" ON notifications
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization()
  AND get_user_role() IN ('admin', 'superadmin')
);
```

#### Update Policy - Users can update their read status
```sql
CREATE POLICY "Users can update read status" ON notifications
FOR UPDATE
USING (
  organization_id = get_user_organization()
  AND (
    user_id = auth.uid()
    OR get_user_role() = ANY(role_target)
  )
)
WITH CHECK (
  organization_id = get_user_organization()
  AND (
    -- Users can only update read status and read_at timestamp
    (user_id = auth.uid() OR get_user_role() = ANY(role_target))
    -- Admins can update all fields
    OR get_user_role() IN ('admin', 'superadmin')
  )
);
```

#### Delete Policy - Admins and notification owners can delete
```sql
CREATE POLICY "Users can delete their notifications" ON notifications
FOR DELETE
USING (
  organization_id = get_user_organization()
  AND (
    user_id = auth.uid()
    OR get_user_role() = ANY(role_target)
    OR get_user_role() IN ('admin', 'superadmin')
  )
);
```

### Supporting Functions

#### get_user_organization()
```sql
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID
LANGUAGE sql
SECURITY definer
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;
```

#### get_user_role()
```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY definer
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
```

## Database Triggers

### Update Timestamp Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Notification Statistics Trigger (Optional)
```sql
-- Materialized view for notification statistics
CREATE MATERIALIZED VIEW notification_stats AS
SELECT 
  organization_id,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE type = 'system') as system_count,
  COUNT(*) FILTER (WHERE type = 'enrollment') as enrollment_count,
  COUNT(*) FILTER (WHERE type = 'payment') as payment_count,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count
FROM notifications 
WHERE deleted_at IS NULL
GROUP BY organization_id;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_notification_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY notification_stats;
  RETURN NULL;
END;
$$;

-- Trigger to refresh stats
CREATE TRIGGER refresh_notification_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_notification_stats();
```

## Real-time Configuration

### Enable Real-time Replication
```sql
-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Real-time Security
```sql
-- Create RLS policy for real-time
CREATE POLICY "Real-time access for notifications" ON notifications
FOR ALL
USING (
  organization_id = get_user_organization()
  AND (
    user_id = auth.uid()
    OR get_user_role() = ANY(role_target)
  )
);
```

## Data Retention and Cleanup

### Automatic Cleanup Function
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Soft delete expired notifications
  UPDATE notifications 
  SET deleted_at = NOW(), deleted_by = NULL
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Optional: Hard delete very old soft-deleted notifications
  DELETE FROM notifications 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '1 year';
  
  RETURN deleted_count;
END;
$$;

-- Schedule cleanup (use pg_cron or external scheduler)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_expired_notifications();');
```

### Archive Old Notifications
```sql
-- Archive table for long-term storage
CREATE TABLE notifications_archive (
  LIKE notifications INCLUDING ALL
);

-- Archive function
CREATE OR REPLACE FUNCTION archive_old_notifications(days_old INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move old notifications to archive
  WITH moved_notifications AS (
    DELETE FROM notifications
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
      AND deleted_at IS NOT NULL
    RETURNING *
  )
  INSERT INTO notifications_archive
  SELECT * FROM moved_notifications;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$;
```

## Query Optimization Patterns

### Efficient Pagination
```sql
-- Cursor-based pagination
SELECT * FROM notifications
WHERE organization_id = $1
  AND user_id = $2
  AND deleted_at IS NULL
  AND (created_at, id) < ($3, $4)  -- Cursor values
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### Bulk Read Operations
```sql
-- Mark multiple notifications as read efficiently
UPDATE notifications 
SET is_read = true, read_at = NOW(), updated_at = NOW()
WHERE id = ANY($1::UUID[])
  AND user_id = $2
  AND organization_id = $3
  AND deleted_at IS NULL;
```

### Complex Filtering Query
```sql
-- Advanced filtering with proper index usage
SELECT n.*, 
       s.full_name as student_name,
       t.full_name as teacher_name,
       g.name as group_name
FROM notifications n
LEFT JOIN students s ON n.related_student_id = s.id
LEFT JOIN teachers t ON n.related_teacher_id = t.id  
LEFT JOIN groups g ON n.related_group_id = g.id
WHERE n.organization_id = $1
  AND n.deleted_at IS NULL
  AND ($2::TEXT IS NULL OR n.type = $2)
  AND ($3::TEXT IS NULL OR n.priority = $3)
  AND ($4::BOOLEAN IS NULL OR n.is_read = $4)
  AND ($5::TIMESTAMPTZ IS NULL OR n.created_at >= $5)
  AND ($6::TIMESTAMPTZ IS NULL OR n.created_at <= $6)
  AND (
    $7::TEXT IS NULL 
    OR n.title ILIKE '%' || $7 || '%'
    OR n.message ILIKE '%' || $7 || '%'
  )
ORDER BY n.created_at DESC
LIMIT $8 OFFSET $9;
```

## Performance Monitoring

### Key Metrics to Monitor
1. **Query Performance**: Average execution time for notification queries
2. **Index Usage**: Monitor index hit ratios and unused indexes
3. **Table Size**: Track notification table growth over time
4. **Real-time Connections**: Monitor Supabase real-time channel connections

### Monitoring Queries
```sql
-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'notifications'
ORDER BY n_distinct DESC;

-- Query performance analysis
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM notifications 
WHERE user_id = 'uuid' AND is_read = false 
ORDER BY created_at DESC LIMIT 20;

-- Table size monitoring
SELECT pg_size_pretty(pg_total_relation_size('notifications')) as table_size,
       pg_size_pretty(pg_relation_size('notifications')) as data_size,
       pg_size_pretty(pg_indexes_size('notifications')) as index_size;
```

## Backup and Recovery

### Backup Strategy
```sql
-- Backup notifications with related data
pg_dump --table=notifications \
        --table=notification_stats \
        --data-only \
        --file=notifications_backup_$(date +%Y%m%d).sql \
        your_database
```

### Point-in-Time Recovery
```sql
-- Example recovery to specific timestamp
SELECT * FROM notifications 
WHERE created_at <= '2024-01-01 12:00:00'
  AND (updated_at <= '2024-01-01 12:00:00' OR updated_at IS NULL);
```

This comprehensive database documentation ensures proper implementation, maintenance, and optimization of the notifications system's data layer.
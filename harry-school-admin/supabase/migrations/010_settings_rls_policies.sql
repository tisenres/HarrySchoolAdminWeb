-- Row Level Security Policies for Settings Tables

-- Enable RLS on all settings tables
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Organization Settings RLS Policies
-- =============================================

-- Users can view organization settings if they belong to that organization
CREATE POLICY "Users can view their organization settings"
ON organization_settings
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND deleted_at IS NULL
    )
);

-- Only superadmin can update organization settings
CREATE POLICY "Superadmin can update organization settings"
ON organization_settings
FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
);

-- Superadmin can insert organization settings
CREATE POLICY "Superadmin can insert organization settings"
ON organization_settings
FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
);

-- =============================================
-- User Notification Settings RLS Policies
-- =============================================

-- Users can view and manage their own notification settings
CREATE POLICY "Users can view their own notification settings"
ON user_notification_settings
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can update their own notification settings"
ON user_notification_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification settings"
ON user_notification_settings
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND deleted_at IS NULL
    )
);

-- =============================================
-- System Settings RLS Policies
-- =============================================

-- Admin and superadmin can view system settings
CREATE POLICY "Admin can view system settings"
ON system_settings
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND deleted_at IS NULL
    )
);

-- Only superadmin can update system settings
CREATE POLICY "Superadmin can update system settings"
ON system_settings
FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
);

-- Superadmin can insert system settings
CREATE POLICY "Superadmin can insert system settings"
ON system_settings
FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
);

-- =============================================
-- Security Events RLS Policies
-- =============================================

-- Admin and superadmin can view security events
CREATE POLICY "Admin can view security events"
ON security_events
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND deleted_at IS NULL
    )
);

-- System can insert security events (no user restrictions)
CREATE POLICY "System can insert security events"
ON security_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- No updates or deletes allowed on security events (audit log)
-- Events should be immutable for audit purposes

-- =============================================
-- User Sessions RLS Policies
-- =============================================

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin can view all organization sessions
CREATE POLICY "Admin can view organization sessions"
ON user_sessions
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND deleted_at IS NULL
    )
);

-- Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions"
ON user_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can manage organization sessions
CREATE POLICY "Admin can manage organization sessions"
ON user_sessions
FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND deleted_at IS NULL
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND deleted_at IS NULL
    )
);

-- =============================================
-- Backup History RLS Policies
-- =============================================

-- Admin and superadmin can view backup history
CREATE POLICY "Admin can view backup history"
ON backup_history
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND deleted_at IS NULL
    )
);

-- Superadmin can manage backups
CREATE POLICY "Superadmin can manage backups"
ON backup_history
FOR ALL
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
        AND deleted_at IS NULL
    )
);

-- System can insert backup records
CREATE POLICY "System can insert backup records"
ON backup_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- Helper Functions for Settings
-- =============================================

-- Function to get user's notification settings with defaults
CREATE OR REPLACE FUNCTION get_user_notification_settings(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(
    user_id UUID,
    organization_id UUID,
    email_enabled BOOLEAN,
    push_enabled BOOLEAN,
    sms_enabled BOOLEAN,
    quiet_hours_enabled BOOLEAN,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    student_updates BOOLEAN,
    teacher_updates BOOLEAN,
    payment_reminders BOOLEAN,
    system_alerts BOOLEAN,
    immediate_alerts BOOLEAN,
    daily_digest BOOLEAN,
    weekly_summary BOOLEAN,
    escalation_enabled BOOLEAN,
    escalation_delay_minutes INTEGER,
    max_escalation_levels INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT 
        COALESCE(uns.user_id, COALESCE(target_user_id, auth.uid())),
        p.organization_id,
        COALESCE(uns.email_enabled, true),
        COALESCE(uns.push_enabled, true),
        COALESCE(uns.sms_enabled, false),
        COALESCE(uns.quiet_hours_enabled, false),
        COALESCE(uns.quiet_hours_start, '22:00'::TIME),
        COALESCE(uns.quiet_hours_end, '08:00'::TIME),
        COALESCE(uns.student_updates, true),
        COALESCE(uns.teacher_updates, true),
        COALESCE(uns.payment_reminders, true),
        COALESCE(uns.system_alerts, true),
        COALESCE(uns.immediate_alerts, true),
        COALESCE(uns.daily_digest, false),
        COALESCE(uns.weekly_summary, true),
        COALESCE(uns.escalation_enabled, true),
        COALESCE(uns.escalation_delay_minutes, 30),
        COALESCE(uns.max_escalation_levels, 2),
        COALESCE(uns.created_at, NOW()),
        COALESCE(uns.updated_at, NOW())
    FROM profiles p
    LEFT JOIN user_notification_settings uns ON uns.user_id = p.id
    WHERE p.id = COALESCE(target_user_id, auth.uid())
    AND p.deleted_at IS NULL;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    event_type TEXT,
    target_user_id UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_str TEXT DEFAULT NULL,
    event_details JSONB DEFAULT '{}'::jsonb,
    event_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    event_id UUID;
    org_id UUID;
BEGIN
    -- Get organization ID from user profile
    SELECT organization_id INTO org_id
    FROM profiles
    WHERE id = COALESCE(target_user_id, auth.uid())
    AND deleted_at IS NULL;
    
    -- If no organization found, use the current user's organization
    IF org_id IS NULL THEN
        SELECT organization_id INTO org_id
        FROM profiles
        WHERE id = auth.uid()
        AND deleted_at IS NULL;
    END IF;
    
    -- Insert security event
    INSERT INTO security_events (
        organization_id,
        user_id,
        event_type,
        ip_address,
        user_agent,
        details,
        severity
    )
    VALUES (
        org_id,
        COALESCE(target_user_id, auth.uid()),
        event_type,
        ip_addr,
        user_agent_str,
        event_details,
        event_severity
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Function to clean up old security events (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete events older than 1 year
    DELETE FROM security_events
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired sessions
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR (last_activity < NOW() - INTERVAL '24 hours' AND is_active = false);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;
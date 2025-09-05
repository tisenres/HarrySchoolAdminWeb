-- Settings Schema Migration
-- This migration creates all the tables needed for the Settings functionality

-- Create organization settings table to extend organizations with detailed settings
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Organization details
    name TEXT,
    description TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    
    -- System preferences
    timezone TEXT DEFAULT 'Asia/Tashkent',
    currency TEXT DEFAULT 'UZS',
    default_language TEXT DEFAULT 'en',
    
    -- Visual preferences
    logo_url TEXT,
    primary_color TEXT DEFAULT '#16a34a',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_org_settings UNIQUE(organization_id)
);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    -- Notification types
    student_updates BOOLEAN DEFAULT true,
    teacher_updates BOOLEAN DEFAULT true,
    payment_reminders BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,
    
    -- Email settings
    immediate_alerts BOOLEAN DEFAULT true,
    daily_digest BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    
    -- Escalation settings
    escalation_enabled BOOLEAN DEFAULT true,
    escalation_delay_minutes INTEGER DEFAULT 30,
    max_escalation_levels INTEGER DEFAULT 2,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_notification_settings UNIQUE(user_id, organization_id)
);

-- Create system settings table (global settings)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Maintenance mode
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT DEFAULT 'System is under maintenance. Please try again later.',
    
    -- Backup settings
    automated_backups BOOLEAN DEFAULT true,
    backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
    backup_time TIME DEFAULT '02:00',
    backup_retention_days INTEGER DEFAULT 30,
    include_attachments BOOLEAN DEFAULT true,
    
    -- Security settings
    password_min_length INTEGER DEFAULT 8,
    password_require_uppercase BOOLEAN DEFAULT true,
    password_require_lowercase BOOLEAN DEFAULT true,
    password_require_numbers BOOLEAN DEFAULT true,
    password_require_symbols BOOLEAN DEFAULT false,
    password_expiry_days INTEGER DEFAULT 90,
    password_history_count INTEGER DEFAULT 3,
    
    session_timeout_minutes INTEGER DEFAULT 480,
    max_login_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    require_captcha_after_attempts INTEGER DEFAULT 3,
    
    -- Two-factor authentication
    require_2fa BOOLEAN DEFAULT false,
    allow_backup_codes BOOLEAN DEFAULT true,
    backup_codes_count INTEGER DEFAULT 10,
    
    -- IP restrictions
    ip_whitelist_enabled BOOLEAN DEFAULT false,
    allowed_ips TEXT[] DEFAULT '{}',
    
    -- System notifications
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    admin_notifications BOOLEAN DEFAULT true,
    
    -- Feature flags
    advanced_reporting BOOLEAN DEFAULT true,
    bulk_operations BOOLEAN DEFAULT true,
    api_access BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_system_settings UNIQUE(organization_id)
);

-- Create security events table for audit logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Event details
    event_type TEXT NOT NULL, -- 'login_failed', 'login_success', 'password_changed', etc.
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for fast querying
    INDEX idx_security_events_org_id ON security_events(organization_id),
    INDEX idx_security_events_user_id ON security_events(user_id),
    INDEX idx_security_events_type ON security_events(event_type),
    INDEX idx_security_events_created ON security_events(created_at DESC)
);

-- Create user sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Session details
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '8 hours'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_user_sessions_user_id ON user_sessions(user_id),
    INDEX idx_user_sessions_token ON user_sessions(session_token),
    INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at)
);

-- Create backup history table
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Backup details
    backup_name TEXT NOT NULL,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automated')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    
    -- File details
    file_path TEXT,
    file_size BIGINT, -- in bytes
    checksum TEXT,
    
    -- Backup contents
    includes_attachments BOOLEAN DEFAULT true,
    tables_included TEXT[] DEFAULT '{}',
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Indexes
    INDEX idx_backup_history_org_id ON backup_history(organization_id),
    INDEX idx_backup_history_status ON backup_history(status),
    INDEX idx_backup_history_created ON backup_history(started_at DESC)
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_settings_updated_at
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing organizations
INSERT INTO organization_settings (organization_id, created_by)
SELECT id, created_by
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_settings);

INSERT INTO system_settings (organization_id, created_by)
SELECT id, created_by
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM system_settings);

-- Grant appropriate permissions
GRANT ALL ON organization_settings TO authenticated;
GRANT ALL ON user_notification_settings TO authenticated;
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON security_events TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON backup_history TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE organization_settings IS 'Stores detailed organization configuration and preferences';
COMMENT ON TABLE user_notification_settings IS 'User-specific notification preferences and settings';
COMMENT ON TABLE system_settings IS 'System-wide configuration including security and feature flags';
COMMENT ON TABLE security_events IS 'Audit log for security-related events and activities';
COMMENT ON TABLE user_sessions IS 'Active user session tracking and management';
COMMENT ON TABLE backup_history IS 'History and metadata of system backups';
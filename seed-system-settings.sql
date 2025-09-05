-- Demo script to insert test system settings for the client demo
-- This creates default system settings for organizations

-- First, let's see what organizations exist
-- SELECT id, name FROM organizations LIMIT 5;

-- Insert system settings for the first organization (replace with actual org ID)
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    -- Get the first organization ID
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    -- Get the first superadmin user ID  
    SELECT id INTO user_id FROM profiles WHERE role = 'superadmin' LIMIT 1;
    
    -- If we have both org and user, insert settings
    IF org_id IS NOT NULL AND user_id IS NOT NULL THEN
        -- Insert maintenance mode setting (disabled by default)
        INSERT INTO system_settings (
            organization_id, category, key, value, data_type, description, is_public, created_by, updated_by
        ) VALUES (
            org_id, 'system', 'maintenance_mode', 'false'::jsonb, 'boolean', 'Enable/disable maintenance mode', false, user_id, user_id
        ) ON CONFLICT (organization_id, category, key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW();

        -- Insert maintenance message
        INSERT INTO system_settings (
            organization_id, category, key, value, data_type, description, is_public, created_by, updated_by
        ) VALUES (
            org_id, 'system', 'maintenance_message', '"System is under maintenance. We''ll be back shortly..."'::jsonb, 'string', 'Message shown during maintenance', false, user_id, user_id
        ) ON CONFLICT (organization_id, category, key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW();

        -- Insert backup schedule
        INSERT INTO system_settings (
            organization_id, category, key, value, data_type, description, is_public, created_by, updated_by
        ) VALUES (
            org_id, 'system', 'backup_schedule', '{"enabled": true, "frequency": "daily", "time": "02:00"}'::jsonb, 'object', 'Automated backup configuration', false, user_id, user_id
        ) ON CONFLICT (organization_id, category, key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW();

        -- Insert feature flags
        INSERT INTO system_settings (
            organization_id, category, key, value, data_type, description, is_public, created_by, updated_by
        ) VALUES (
            org_id, 'system', 'feature_flags', '{"advanced_reporting": true, "bulk_operations": true, "api_access": false}'::jsonb, 'object', 'Feature flags configuration', false, user_id, user_id
        ) ON CONFLICT (organization_id, category, key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW();

        RAISE NOTICE 'System settings inserted/updated for organization: %', org_id;
        RAISE NOTICE 'Created by user: %', user_id;
    ELSE
        RAISE NOTICE 'Could not find organization or superadmin user to create settings';
        RAISE NOTICE 'Organization ID: %, User ID: %', org_id, user_id;
    END IF;
END $$;

-- Verify the data was inserted
SELECT 
    ss.category,
    ss.key,
    ss.value,
    ss.data_type,
    ss.description,
    o.name as organization_name,
    p.email as created_by_email
FROM system_settings ss
JOIN organizations o ON ss.organization_id = o.id
JOIN profiles p ON ss.created_by = p.id
WHERE ss.category = 'system'
ORDER BY ss.key;
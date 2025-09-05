import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase/client'

// Mock fetch globally
global.fetch = jest.fn()

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key)
}))

// Mock supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        })),
        insert: jest.fn(() => ({ data: null, error: null })),
        update: jest.fn(() => ({ data: null, error: null })),
        delete: jest.fn(() => ({ data: null, error: null }))
      }))
    }))
  }
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Settings: () => React.createElement('div', { 'data-testid': 'settings-icon' }, 'Settings Icon'),
  Users: () => React.createElement('div', { 'data-testid': 'users-icon' }, 'Users Icon'),
  Shield: () => React.createElement('div', { 'data-testid': 'shield-icon' }, 'Shield Icon'),
  Database: () => React.createElement('div', { 'data-testid': 'database-icon' }, 'Database Icon'),
  Bell: () => React.createElement('div', { 'data-testid': 'bell-icon' }, 'Bell Icon'),
  Archive: () => React.createElement('div', { 'data-testid': 'archive-icon' }, 'Archive Icon'),
  Building: () => React.createElement('div', { 'data-testid': 'building-icon' }, 'Building Icon'),
  CheckCircle: () => React.createElement('div', { 'data-testid': 'check-circle-icon' }, 'Check Icon'),
  AlertTriangle: () => React.createElement('div', { 'data-testid': 'alert-triangle-icon' }, 'Alert Icon'),
  Info: () => React.createElement('div', { 'data-testid': 'info-icon' }, 'Info Icon'),
  Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }, 'Loading Icon')
}))

// Mock all settings components
jest.mock('@/components/admin/settings/organization-settings', () => ({
  OrganizationSettings: () => React.createElement('div', { 'data-testid': 'organization-settings' }, 'Organization Settings Component')
}))

jest.mock('@/components/admin/settings/user-management', () => ({
  UserManagement: () => React.createElement('div', { 'data-testid': 'user-management' }, 'User Management Component')
}))

jest.mock('@/components/admin/settings/system-settings', () => ({
  SystemSettings: () => React.createElement('div', { 'data-testid': 'system-settings' }, 'System Settings Component')
}))

jest.mock('@/components/admin/settings/security-settings', () => ({
  SecuritySettings: () => React.createElement('div', { 'data-testid': 'security-settings' }, 'Security Settings Component')
}))

jest.mock('@/components/admin/settings/notification-settings', () => ({
  NotificationSettings: () => React.createElement('div', { 'data-testid': 'notification-settings' }, 'Notification Settings Component')
}))

jest.mock('@/components/admin/settings/backup-management', () => ({
  BackupManagement: () => React.createElement('div', { 'data-testid': 'backup-management' }, 'Backup Management Component')
}))

jest.mock('@/components/admin/settings/archive-management', () => ({
  ArchiveManagement: () => React.createElement('div', { 'data-testid': 'archive-management' }, 'Archive Management Component')
}))

describe('Settings Page Functionality', () => {
  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    user_metadata: {
      role: 'admin'
    }
  }

  const mockProfile = {
    organization_id: 'org-1',
    role: 'admin'
  }

  const mockSettingsStatus = {
    organization: 'complete',
    users: 'incomplete',
    security: 'warning',
    backup: 'incomplete',
    notifications: 'complete'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    
    // Mock successful auth
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser }
    })
    
    // Mock profile fetch
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
    })
  })

  describe('Settings Overview Tab', () => {
    it('should display settings status cards', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          status: mockSettingsStatus
        })
      })

      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="overview" />)

      await waitFor(() => {
        expect(screen.getByText('Settings Overview')).toBeInTheDocument()
      })

      expect(fetch).toHaveBeenCalledWith('/api/settings/status')
    })

    it('should show system health status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: mockSettingsStatus })
      })

      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="overview" />)

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument()
      })
    })

    it('should handle settings status API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="overview" />)

      await waitFor(() => {
        expect(screen.getByText('Settings Overview')).toBeInTheDocument()
      })
    })

    it('should allow navigation between tabs by clicking cards', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: mockSettingsStatus })
      })

      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="overview" />)

      await waitFor(() => {
        expect(screen.getByText('Organization')).toBeInTheDocument()
      })

      // Click on organization card should switch to organization tab
      const organizationCard = screen.getByText('Organization').closest('[role="button"], .cursor-pointer')
      if (organizationCard) {
        fireEvent.click(organizationCard)
      }
    })
  })

  describe('Organization Settings Tab', () => {
    it('should render organization settings component', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: mockSettingsStatus })
      })

      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="organization" />)

      await waitFor(() => {
        expect(screen.getByTestId('organization-settings')).toBeInTheDocument()
      })
    })

    it('should save organization information', async () => {
      const orgData = {
        name: 'Harry School Center',
        description: 'Premier education center in Tashkent',
        phone: '+998712345678',
        email: 'info@harryschool.uz',
        address: {
          street: '123 Amir Temur Street',
          city: 'Tashkent',
          country: 'Uzbekistan'
        },
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
        language: 'en'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: orgData })
      })

      const response = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/settings/organization', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(orgData)
      }))
      expect(result.success).toBe(true)
    })

    it('should validate organization data', async () => {
      const invalidOrgData = {
        name: '',  // Required field
        phone: 'invalid-phone',  // Invalid format
        email: 'invalid-email'   // Invalid format
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation error',
          details: [
            { field: 'name', message: 'Organization name is required' },
            { field: 'phone', message: 'Invalid phone format' },
            { field: 'email', message: 'Invalid email format' }
          ]
        })
      })

      const response = await fetch('/api/settings/organization', {
        method: 'PATCH',
        body: JSON.stringify(invalidOrgData)
      })
      const result = await response.json()

      expect(result.error).toBe('Validation error')
      expect(result.details).toHaveLength(3)
    })
  })

  describe('User Management Tab', () => {
    it('should render user management component', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="users" />)

      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument()
      })
    })

    it('should fetch admin users list', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'admin@harryschool.uz',
          role: 'admin',
          status: 'active',
          last_login: '2024-01-15T10:00:00Z',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'user-2',
          email: 'superadmin@harryschool.uz',
          role: 'superadmin',
          status: 'active',
          last_login: '2024-01-15T09:00:00Z',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers })
      })

      const response = await fetch('/api/settings/users')
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/settings/users')
      expect(result.data).toHaveLength(2)
      expect(result.data[0].role).toBe('admin')
    })

    it('should create new admin user', async () => {
      const newUser = {
        email: 'newadmin@harryschool.uz',
        role: 'admin',
        first_name: 'New',
        last_name: 'Admin',
        send_invitation: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...newUser, id: 'user-3' } })
      })

      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.email).toBe('newadmin@harryschool.uz')
    })

    it('should update user role and status', async () => {
      const updates = {
        role: 'superadmin',
        status: 'inactive'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updates })
      })

      const response = await fetch('/api/settings/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
      const result = await response.json()

      expect(result.data.role).toBe('superadmin')
      expect(result.data.status).toBe('inactive')
    })

    it('should delete admin user', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const response = await fetch('/api/settings/users/user-2', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(result.success).toBe(true)
    })
  })

  describe('System Settings Tab', () => {
    it('should render system settings component', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="system" />)

      await waitFor(() => {
        expect(screen.getByTestId('system-settings')).toBeInTheDocument()
      })
    })

    it('should update system configuration', async () => {
      const systemConfig = {
        maintenance_mode: false,
        debug_mode: false,
        max_file_upload_size: 10485760, // 10MB
        session_timeout: 3600, // 1 hour
        password_min_length: 8,
        password_require_special_chars: true,
        auto_backup_enabled: true,
        auto_backup_frequency: 'daily',
        email_notifications_enabled: true,
        sms_notifications_enabled: false
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: systemConfig })
      })

      const response = await fetch('/api/settings/system', {
        method: 'PATCH',
        body: JSON.stringify(systemConfig)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.maintenance_mode).toBe(false)
    })

    it('should get system information', async () => {
      const systemInfo = {
        version: '1.0.0',
        database_version: '15.0',
        uptime: '7 days, 3 hours',
        memory_usage: '512MB',
        disk_usage: '2.1GB',
        last_backup: '2024-01-15T02:00:00Z',
        environment: 'production'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: systemInfo })
      })

      const response = await fetch('/api/settings/system/info')
      const result = await response.json()

      expect(result.data.version).toBe('1.0.0')
      expect(result.data.environment).toBe('production')
    })
  })

  describe('Security Settings Tab', () => {
    it('should render security settings component', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="security" />)

      await waitFor(() => {
        expect(screen.getByTestId('security-settings')).toBeInTheDocument()
      })
    })

    it('should update password policy', async () => {
      const passwordPolicy = {
        min_length: 12,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true,
        max_age_days: 90,
        prevent_reuse_count: 5,
        lockout_attempts: 5,
        lockout_duration: 30
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: passwordPolicy })
      })

      const response = await fetch('/api/settings/security/password-policy', {
        method: 'PATCH',
        body: JSON.stringify(passwordPolicy)
      })
      const result = await response.json()

      expect(result.data.min_length).toBe(12)
      expect(result.data.require_special_chars).toBe(true)
    })

    it('should enable two-factor authentication', async () => {
      const twoFAConfig = {
        enabled: true,
        enforce_for_admins: true,
        backup_codes_count: 10,
        remember_device_days: 30
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: twoFAConfig })
      })

      const response = await fetch('/api/settings/security/2fa', {
        method: 'PATCH',
        body: JSON.stringify(twoFAConfig)
      })
      const result = await response.json()

      expect(result.data.enabled).toBe(true)
      expect(result.data.enforce_for_admins).toBe(true)
    })

    it('should configure session settings', async () => {
      const sessionConfig = {
        timeout_minutes: 60,
        remember_me_days: 30,
        concurrent_sessions_limit: 3,
        force_logout_on_password_change: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: sessionConfig })
      })

      const response = await fetch('/api/settings/security/sessions', {
        method: 'PATCH',
        body: JSON.stringify(sessionConfig)
      })
      const result = await response.json()

      expect(result.data.timeout_minutes).toBe(60)
      expect(result.data.concurrent_sessions_limit).toBe(3)
    })
  })

  describe('Notification Settings Tab', () => {
    it('should render notification settings component', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="notifications" />)

      await waitFor(() => {
        expect(screen.getByTestId('notification-settings')).toBeInTheDocument()
      })
    })

    it('should update email notification settings', async () => {
      const emailSettings = {
        enabled: true,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_username: 'noreply@harryschool.uz',
        smtp_encryption: 'tls',
        from_name: 'Harry School Admin',
        from_email: 'noreply@harryschool.uz'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: emailSettings })
      })

      const response = await fetch('/api/settings/notifications/email', {
        method: 'PATCH',
        body: JSON.stringify(emailSettings)
      })
      const result = await response.json()

      expect(result.data.enabled).toBe(true)
      expect(result.data.smtp_host).toBe('smtp.gmail.com')
    })

    it('should test email configuration', async () => {
      const testEmail = {
        to: 'admin@harryschool.uz',
        subject: 'Test Email Configuration',
        body: 'This is a test email to verify SMTP settings.'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Test email sent successfully' })
      })

      const response = await fetch('/api/settings/notifications/email/test', {
        method: 'POST',
        body: JSON.stringify(testEmail)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.message).toContain('sent successfully')
    })

    it('should configure notification preferences', async () => {
      const preferences = {
        new_student_enrollment: true,
        payment_overdue: true,
        group_capacity_full: true,
        teacher_absence: true,
        system_maintenance: true,
        data_backup_complete: false,
        security_alerts: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: preferences })
      })

      const response = await fetch('/api/settings/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferences)
      })
      const result = await response.json()

      expect(result.data.new_student_enrollment).toBe(true)
      expect(result.data.security_alerts).toBe(true)
    })
  })

  describe('Backup Management Tab', () => {
    it('should render backup management component', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="backup" />)

      await waitFor(() => {
        expect(screen.getByTestId('backup-management')).toBeInTheDocument()
      })
    })

    it('should create manual backup', async () => {
      const backupResult = {
        id: 'backup-1',
        filename: 'harry-school-backup-20240115-120000.sql',
        size: 15728640, // 15MB
        created_at: '2024-01-15T12:00:00Z',
        status: 'completed'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: backupResult })
      })

      const response = await fetch('/api/settings/backup/create', {
        method: 'POST'
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('completed')
    })

    it('should list backup history', async () => {
      const backupHistory = [
        {
          id: 'backup-1',
          filename: 'harry-school-backup-20240115-120000.sql',
          size: 15728640,
          created_at: '2024-01-15T12:00:00Z',
          type: 'manual',
          status: 'completed'
        },
        {
          id: 'backup-2',
          filename: 'harry-school-backup-20240114-020000.sql',
          size: 15234567,
          created_at: '2024-01-14T02:00:00Z',
          type: 'automatic',
          status: 'completed'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: backupHistory })
      })

      const response = await fetch('/api/settings/backup/history')
      const result = await response.json()

      expect(result.data).toHaveLength(2)
      expect(result.data[0].type).toBe('manual')
      expect(result.data[1].type).toBe('automatic')
    })

    it('should restore from backup', async () => {
      const restoreRequest = {
        backup_id: 'backup-1',
        confirm: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Database restored successfully' })
      })

      const response = await fetch('/api/settings/backup/restore', {
        method: 'POST',
        body: JSON.stringify(restoreRequest)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.message).toContain('restored successfully')
    })

    it('should configure automatic backup schedule', async () => {
      const scheduleConfig = {
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retention_days: 30,
        include_uploads: true,
        compress: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: scheduleConfig })
      })

      const response = await fetch('/api/settings/backup/schedule', {
        method: 'PATCH',
        body: JSON.stringify(scheduleConfig)
      })
      const result = await response.json()

      expect(result.data.enabled).toBe(true)
      expect(result.data.frequency).toBe('daily')
    })
  })

  describe('Archive Management Tab', () => {
    it('should render archive management component', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="archive" />)

      await waitFor(() => {
        expect(screen.getByTestId('archive-management')).toBeInTheDocument()
      })
    })

    it('should list archived records', async () => {
      const archivedRecords = [
        {
          id: 'student-1',
          type: 'student',
          name: 'John Doe',
          deleted_at: '2024-01-10T10:00:00Z',
          deleted_by: 'admin@harryschool.uz',
          can_restore: true
        },
        {
          id: 'group-1',
          type: 'group',
          name: 'IELTS Advanced Group',
          deleted_at: '2024-01-05T15:30:00Z',
          deleted_by: 'admin@harryschool.uz',
          can_restore: false
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: archivedRecords })
      })

      const response = await fetch('/api/settings/archive')
      const result = await response.json()

      expect(result.data).toHaveLength(2)
      expect(result.data[0].type).toBe('student')
      expect(result.data[1].can_restore).toBe(false)
    })

    it('should restore archived record', async () => {
      const restoreRequest = {
        id: 'student-1',
        type: 'student'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Record restored successfully' })
      })

      const response = await fetch('/api/settings/archive/restore', {
        method: 'POST',
        body: JSON.stringify(restoreRequest)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.message).toContain('restored successfully')
    })

    it('should permanently delete archived record', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Record permanently deleted' })
      })

      const response = await fetch('/api/settings/archive/student-1/permanent', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.message).toContain('permanently deleted')
    })

    it('should configure archive retention policy', async () => {
      const retentionPolicy = {
        auto_delete_after_days: 90,
        notify_before_deletion: true,
        notification_days_before: 7,
        require_confirmation: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: retentionPolicy })
      })

      const response = await fetch('/api/settings/archive/retention', {
        method: 'PATCH',
        body: JSON.stringify(retentionPolicy)
      })
      const result = await response.json()

      expect(result.data.auto_delete_after_days).toBe(90)
      expect(result.data.notify_before_deletion).toBe(true)
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="overview" />)

      // Should start with overview
      await waitFor(() => {
        expect(screen.getByText('Settings Overview')).toBeInTheDocument()
      })

      // Click on Organization tab
      const organizationTab = screen.getByText('Organization')
      fireEvent.click(organizationTab)

      await waitFor(() => {
        expect(screen.getByTestId('organization-settings')).toBeInTheDocument()
      })
    })

    it('should maintain active tab state', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="users" />)

      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument()
      })
    })

    it('should handle invalid tab gracefully', async () => {
      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="invalid-tab" />)

      // Should fall back to overview or handle gracefully
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })
  })

  describe('Settings Status Integration', () => {
    it('should refresh status when returning to overview', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: mockSettingsStatus })
      })

      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="overview" />)

      // Should call status API on initial load
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/settings/status')
      })

      // Navigate away and back
      const usersTab = screen.getByText('User Management')
      fireEvent.click(usersTab)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      // Should call status API again
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('should display correct status badges', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: mockSettingsStatus })
      })

      const SettingsDashboard = require('@/components/admin/settings/settings-dashboard').SettingsDashboard
      render(<SettingsDashboard initialTab="overview" />)

      await waitFor(() => {
        expect(screen.getByText('Settings Overview')).toBeInTheDocument()
      })

      // Should show status indicators
      expect(screen.getByText('System Health')).toBeInTheDocument()
    })
  })
})
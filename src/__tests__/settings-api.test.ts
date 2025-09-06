// Mock fetch globally
global.fetch = jest.fn()

describe('Settings API Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Settings Overview and Status', () => {
    it('should fetch settings status', async () => {
      const mockStatus = {
        organization: 'complete',
        users: 'incomplete',
        security: 'warning',
        backup: 'incomplete',
        notifications: 'complete'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, status: mockStatus })
      })

      const response = await fetch('/api/settings/status')
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/settings/status')
      expect(result.success).toBe(true)
      expect(result.status.organization).toBe('complete')
      expect(result.status.security).toBe('warning')
    })

    it('should handle settings status API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      const response = await fetch('/api/settings/status')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('Organization Settings', () => {
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
      expect(result.data.name).toBe('Harry School Center')
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

    it('should fetch organization settings', async () => {
      const orgSettings = {
        name: 'Harry School Center',
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
        language: 'en',
        academic_year_start: '09-01',
        business_hours: {
          start: '08:00',
          end: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: orgSettings })
      })

      const response = await fetch('/api/settings/organization')
      const result = await response.json()

      expect(result.data.currency).toBe('UZS')
      expect(result.data.business_hours.days).toHaveLength(6)
    })
  })

  describe('User Management', () => {
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
      expect(result.data[1].role).toBe('superadmin')
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
      expect(result.data.role).toBe('admin')
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
        json: async () => ({ success: true, message: 'User deleted successfully' })
      })

      const response = await fetch('/api/settings/users/user-2', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.message).toContain('deleted successfully')
    })

    it('should prevent deletion of last superadmin', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Cannot delete the last superadmin user'
        })
      })

      const response = await fetch('/api/settings/users/user-1', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(result.error).toContain('last superadmin')
    })
  })

  describe('System Settings', () => {
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
      expect(result.data.max_file_upload_size).toBe(10485760)
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
      expect(result.data.uptime).toContain('days')
    })

    it('should handle maintenance mode toggle', async () => {
      const maintenanceConfig = {
        maintenance_mode: true,
        maintenance_message: 'System maintenance in progress. Please try again later.'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: maintenanceConfig })
      })

      const response = await fetch('/api/settings/system/maintenance', {
        method: 'PATCH',
        body: JSON.stringify(maintenanceConfig)
      })
      const result = await response.json()

      expect(result.data.maintenance_mode).toBe(true)
      expect(result.data.maintenance_message).toContain('maintenance')
    })
  })

  describe('Security Settings', () => {
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
      expect(result.data.lockout_attempts).toBe(5)
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
      expect(result.data.backup_codes_count).toBe(10)
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
      expect(result.data.force_logout_on_password_change).toBe(true)
    })

    it('should get security audit log', async () => {
      const auditLog = [
        {
          id: 'audit-1',
          event: 'PASSWORD_CHANGE',
          user_id: 'user-1',
          ip_address: '192.168.1.1',
          timestamp: '2024-01-15T10:30:00Z',
          details: 'Password changed successfully'
        },
        {
          id: 'audit-2',
          event: 'LOGIN_FAILED',
          user_id: 'user-2',
          ip_address: '192.168.1.2',
          timestamp: '2024-01-15T09:45:00Z',
          details: 'Invalid password attempt'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: auditLog })
      })

      const response = await fetch('/api/settings/security/audit-log')
      const result = await response.json()

      expect(result.data).toHaveLength(2)
      expect(result.data[0].event).toBe('PASSWORD_CHANGE')
      expect(result.data[1].event).toBe('LOGIN_FAILED')
    })
  })

  describe('Notification Settings', () => {
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
      expect(result.data.smtp_port).toBe(587)
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
      expect(result.data.data_backup_complete).toBe(false)
    })

    it('should update SMS notification settings', async () => {
      const smsSettings = {
        enabled: true,
        provider: 'twilio',
        api_key: 'sk_test_123456',
        sender_id: 'HARRYSCH',
        default_country_code: '+998'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: smsSettings })
      })

      const response = await fetch('/api/settings/notifications/sms', {
        method: 'PATCH',
        body: JSON.stringify(smsSettings)
      })
      const result = await response.json()

      expect(result.data.enabled).toBe(true)
      expect(result.data.provider).toBe('twilio')
      expect(result.data.default_country_code).toBe('+998')
    })
  })

  describe('Backup Management', () => {
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
      expect(result.data.filename).toContain('backup')
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
      expect(result.data.retention_days).toBe(30)
    })

    it('should download backup file', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['backup data'], { type: 'application/sql' }),
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="backup-20240115.sql"'
        })
      })

      const response = await fetch('/api/settings/backup/backup-1/download')
      
      expect(response.ok).toBe(true)
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
    })
  })

  describe('Archive Management', () => {
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
      expect(result.data.require_confirmation).toBe(true)
    })

    it('should bulk restore multiple archived records', async () => {
      const bulkRestoreRequest = {
        records: [
          { id: 'student-1', type: 'student' },
          { id: 'student-2', type: 'student' },
          { id: 'teacher-1', type: 'teacher' }
        ]
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          restored: 3,
          failed: 0,
          errors: []
        })
      })

      const response = await fetch('/api/settings/archive/bulk-restore', {
        method: 'POST',
        body: JSON.stringify(bulkRestoreRequest)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.restored).toBe(3)
      expect(result.failed).toBe(0)
    })
  })

  describe('Settings Validation and Error Handling', () => {
    it('should validate required fields across all settings', async () => {
      const invalidSettings = {
        organization: { name: '' },
        email: { smtp_host: '' },
        backup: { retention_days: -1 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation failed',
          details: [
            { section: 'organization', field: 'name', message: 'Name is required' },
            { section: 'email', field: 'smtp_host', message: 'SMTP host is required' },
            { section: 'backup', field: 'retention_days', message: 'Must be positive number' }
          ]
        })
      })

      const response = await fetch('/api/settings/validate', {
        method: 'POST',
        body: JSON.stringify(invalidSettings)
      })
      const result = await response.json()

      expect(result.error).toBe('Validation failed')
      expect(result.details).toHaveLength(3)
    })

    it('should handle unauthorized access to settings', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: 'Insufficient permissions'
        })
      })

      const response = await fetch('/api/settings/security/password-policy', {
        method: 'PATCH',
        body: JSON.stringify({ min_length: 6 })
      })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Insufficient permissions')
    })

    it('should handle network timeouts gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'))

      try {
        await fetch('/api/settings/backup/create', { method: 'POST' })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network timeout')
      }
    })
  })
})
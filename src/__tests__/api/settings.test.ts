/**
 * Comprehensive API Tests for Settings Module
 * Tests all Settings API endpoints for functionality, validation, and authorization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock modules
vi.mock('@/lib/auth')
vi.mock('@/lib/supabase/server')

import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// Import API handlers
import { GET as getStatus } from '@/app/api/settings/status/route'
import { GET as getOrganization, PUT as putOrganization } from '@/app/api/settings/organization/route'
import { GET as getUsers, POST as postUsers } from '@/app/api/settings/users/route'
import { GET as getSecurity, PUT as putSecurity } from '@/app/api/settings/security/route'
import { GET as getNotifications, PUT as putNotifications } from '@/app/api/settings/notifications/route'
import { GET as getBackup, PUT as putBackup, POST as postBackup } from '@/app/api/settings/backup/route'
import { GET as getSystem, PUT as putSystem } from '@/app/api/settings/system/route'
import { GET as getArchive, POST as postArchive } from '@/app/api/settings/archive/route'

// Test data
const mockUser = {
  id: 'user-123',
  email: 'admin@test.com'
}

const mockProfile = {
  id: 'profile-123',
  user_id: 'user-123',
  organization_id: 'org-123',
  role: 'admin',
  full_name: 'Admin User',
  email: 'admin@test.com'
}

const mockSuperadminProfile = {
  ...mockProfile,
  role: 'superadmin'
}

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  range: vi.fn(),
  order: vi.fn(),
  not: vi.fn(),
  gte: vi.fn(),
  lt: vi.fn()
}

describe('Settings API Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup default mocks
    ;(getCurrentUser as any).mockResolvedValue(mockUser)
    ;(getCurrentProfile as any).mockResolvedValue(mockProfile)
    ;(createServerClient as any).mockResolvedValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Settings Status API', () => {
    it('should return settings status for admin user', async () => {
      // Mock database responses
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { name: 'Test Org', address: '123 Test St' },
              error: null
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/status')
      const response = await getStatus(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('organization')
      expect(data).toHaveProperty('users')
      expect(data).toHaveProperty('security')
      expect(data).toHaveProperty('backup')
      expect(data).toHaveProperty('notifications')
    })

    it('should reject unauthorized users', async () => {
      ;(getCurrentUser as any).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/settings/status')
      const response = await getStatus(request as NextRequest)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should reject users without admin role', async () => {
      ;(getCurrentProfile as any).mockResolvedValue({ ...mockProfile, role: 'user' })

      const request = new Request('http://localhost:3000/api/settings/status')
      const response = await getStatus(request as NextRequest)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Insufficient permissions' })
    })
  })

  describe('Organization Settings API', () => {
    it('should get organization settings successfully', async () => {
      const mockOrgData = {
        name: 'Test Organization',
        address: '123 Test Street',
        phone: '+1234567890',
        email: 'org@test.com',
        website: 'https://test.com'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockOrgData,
              error: null
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/organization')
      const response = await getOrganization(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockOrgData)
    })

    it('should update organization settings successfully', async () => {
      const updateData = {
        name: 'Updated Organization',
        address: '456 New Street'
      }

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...updateData, updated_at: new Date().toISOString() },
                error: null
              })
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await putOrganization(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe(updateData.name)
      expect(data.address).toBe(updateData.address)
    })

    it('should validate organization data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        email: 'invalid-email' // Invalid email format
      }

      const request = new Request('http://localhost:3000/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await putOrganization(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })
  })

  describe('User Management API', () => {
    it('should list users successfully', async () => {
      const mockUsers = [
        { id: '1', full_name: 'User 1', email: 'user1@test.com', role: 'admin' },
        { id: '2', full_name: 'User 2', email: 'user2@test.com', role: 'user' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockUsers,
              error: null
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/users')
      const response = await getUsers(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toHaveLength(2)
      expect(data.users[0]).toEqual(mockUsers[0])
    })

    it('should invite new user successfully', async () => {
      const inviteData = {
        email: 'newuser@test.com',
        role: 'admin',
        full_name: 'New User'
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...inviteData, id: 'new-user-id' },
              error: null
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'invite', ...inviteData }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await postUsers(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('invited successfully')
      expect(data.user.email).toBe(inviteData.email)
    })
  })

  describe('Security Settings API', () => {
    it('should get security settings with defaults', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No settings found
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/security')
      const response = await getSecurity(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.password_min_length).toBe(8)
      expect(data.require_2fa).toBe(false)
      expect(data.session_timeout_minutes).toBe(480)
    })

    it('should update security settings (superadmin only)', async () => {
      ;(getCurrentProfile as any).mockResolvedValue(mockSuperadminProfile)

      const securityData = {
        password_min_length: 12,
        require_2fa: true,
        session_timeout_minutes: 240
      }

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'settings-id' },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: securityData,
                error: null
              })
            })
          })
        })
      })

      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null })

      const request = new Request('http://localhost:3000/api/settings/security', {
        method: 'PUT',
        body: JSON.stringify(securityData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await putSecurity(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.password_min_length).toBe(12)
      expect(data.require_2fa).toBe(true)
    })

    it('should reject non-superadmin updates', async () => {
      const securityData = { password_min_length: 12 }

      const request = new Request('http://localhost:3000/api/settings/security', {
        method: 'PUT',
        body: JSON.stringify(securityData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await putSecurity(request as NextRequest)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ 
        error: 'Only superadmin can update security settings' 
      })
    })
  })

  describe('Backup Management API', () => {
    it('should get backup settings and statistics', async () => {
      const mockBackupSettings = {
        automated_backups: true,
        backup_frequency: 'daily',
        backup_time: '02:00',
        backup_retention_days: 30
      }

      const mockBackupStats = [
        { id: '1', file_size: 1000000 },
        { id: '2', file_size: 2000000 }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'system_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockBackupSettings,
                  error: null
                })
              })
            })
          }
        } else if (table === 'backup_history') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { completed_at: new Date().toISOString(), status: 'completed' },
                      error: null
                    })
                  })
                }),
                mockResolvedValue: {
                  data: mockBackupStats,
                  error: null
                }
              })
            })
          }
        }
      })

      const request = new Request('http://localhost:3000/api/settings/backup')
      const response = await getBackup(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings).toBeDefined()
      expect(data.statistics).toBeDefined()
    })

    it('should create manual backup (superadmin only)', async () => {
      ;(getCurrentProfile as any).mockResolvedValue(mockSuperadminProfile)

      const mockBackupRecord = {
        id: 'backup-123',
        backup_name: 'manual_backup_test',
        status: 'pending'
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBackupRecord,
              error: null
            })
          })
        })
      })

      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null })

      const request = new Request('http://localhost:3000/api/settings/backup', {
        method: 'POST'
      })

      const response = await postBackup(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('backup started successfully')
      expect(data.backup.status).toBe('pending')
    })
  })

  describe('System Settings API', () => {
    it('should get system settings (superadmin only)', async () => {
      ;(getCurrentProfile as any).mockResolvedValue(mockSuperadminProfile)

      const mockSystemSettings = {
        maintenance_mode: false,
        features_enabled: ['teachers', 'students', 'groups'],
        max_students_per_org: 1000
      }

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Return defaults
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/system')
      const response = await getSystem(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.maintenance_mode).toBe(false)
      expect(data.features_enabled).toContain('teachers')
      expect(data.max_students_per_org).toBe(1000)
    })

    it('should reject non-superadmin access', async () => {
      const request = new Request('http://localhost:3000/api/settings/system')
      const response = await getSystem(request as NextRequest)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ 
        error: 'Only superadmin can view system settings' 
      })
    })
  })

  describe('Archive Management API', () => {
    it('should list archived items', async () => {
      const mockArchivedItems = [
        {
          id: '1',
          full_name: 'Deleted Teacher',
          deleted_at: new Date().toISOString(),
          deleted_by: 'user-123',
          profiles: { full_name: 'Admin User', email: 'admin@test.com' }
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockArchivedItems,
                  error: null
                })
              })
            })
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/archive?table=teachers')
      const response = await getArchive(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.archives).toHaveLength(1)
      expect(data.archives[0].table).toBe('teachers')
    })

    it('should restore archived item', async () => {
      const restoreData = {
        action: 'restore',
        table: 'teachers',
        id: 'teacher-123',
        reason: 'Accidental deletion'
      }

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'teacher-123', full_name: 'Restored Teacher' },
                  error: null
                })
              })
            })
          })
        })
      })

      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null })

      const request = new Request('http://localhost:3000/api/settings/archive', {
        method: 'POST',
        body: JSON.stringify(restoreData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await postArchive(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('restored successfully')
      expect(data.restored_item).toBeDefined()
    })

    it('should permanently delete item (superadmin only)', async () => {
      ;(getCurrentProfile as any).mockResolvedValue(mockSuperadminProfile)

      const deleteData = {
        action: 'permanent_delete',
        table: 'teachers',
        id: 'teacher-123',
        confirmation: 'PERMANENTLY_DELETE',
        reason: 'Data cleanup - no longer needed'
      }

      mockSupabaseClient.from.mockImplementation((table) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'teacher-123', full_name: 'Teacher to Delete' },
                error: null
              })
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      }))

      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null })

      const request = new Request('http://localhost:3000/api/settings/archive', {
        method: 'POST',
        body: JSON.stringify(deleteData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await postArchive(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('permanently deleted')
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      })

      const request = new Request('http://localhost:3000/api/settings/status')
      const response = await getStatus(request as NextRequest)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ 
        error: 'Failed to fetch settings status' 
      })
    })

    it('should handle malformed JSON requests', async () => {
      const request = new Request('http://localhost:3000/api/settings/organization', {
        method: 'PUT',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await putOrganization(request as NextRequest)

      expect(response.status).toBe(400)
    })
  })
})
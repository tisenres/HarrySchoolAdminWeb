import { createServerClient } from '@/lib/supabase/server'

export interface SystemSettings {
  maintenance_mode: boolean
  maintenance_message: string
  backup_schedule: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
  }
  feature_flags: {
    advanced_reporting: boolean
    bulk_operations: boolean
    api_access: boolean
  }
}

export class SystemSettingsServerService {
  private static cache: Map<string, { data: SystemSettings; expires: number }> = new Map()
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get system settings from cache or database (server-side)
   */
  static async getSettings(organizationId: string): Promise<SystemSettings> {
    const cacheKey = `settings:${organizationId}`
    const cached = this.cache.get(cacheKey)

    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    try {
      const supabase = await createServerClient()
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('organization_id', organizationId)
        .eq('category', 'system')

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      const settingsMap: Record<string, any> = {}
      
      if (settings && settings.length > 0) {
        settings.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value
        })
      }

      const systemSettings: SystemSettings = {
        maintenance_mode: settingsMap.maintenance_mode || false,
        maintenance_message: settingsMap.maintenance_message || 'System is under maintenance. We\'ll be back shortly...',
        backup_schedule: settingsMap.backup_schedule || {
          enabled: true,
          frequency: 'daily' as const,
          time: '02:00'
        },
        feature_flags: settingsMap.feature_flags || {
          advanced_reporting: true,
          bulk_operations: true,
          api_access: false
        }
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: systemSettings,
        expires: Date.now() + this.CACHE_TTL
      })

      return systemSettings
    } catch (error) {
      console.error('Error fetching system settings:', error)
      // Return defaults on error
      return this.getDefaultSettings()
    }
  }

  /**
   * Check if maintenance mode is enabled
   */
  static async isMaintenanceModeEnabled(organizationId: string): Promise<boolean> {
    const settings = await this.getSettings(organizationId)
    return settings.maintenance_mode
  }

  /**
   * Get maintenance message
   */
  static async getMaintenanceMessage(organizationId: string): Promise<string> {
    const settings = await this.getSettings(organizationId)
    return settings.maintenance_message
  }

  /**
   * Check if a feature flag is enabled
   */
  static async isFeatureEnabled(
    organizationId: string, 
    feature: keyof SystemSettings['feature_flags']
  ): Promise<boolean> {
    const settings = await this.getSettings(organizationId)
    return settings.feature_flags[feature]
  }

  /**
   * Clear cache for a specific organization
   */
  static clearCache(organizationId: string): void {
    const cacheKey = `settings:${organizationId}`
    this.cache.delete(cacheKey)
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.cache.clear()
  }

  /**
   * Get default settings
   */
  static getDefaultSettings(): SystemSettings {
    return {
      maintenance_mode: false,
      maintenance_message: 'System is under maintenance. We\'ll be back shortly...',
      backup_schedule: {
        enabled: true,
        frequency: 'daily',
        time: '02:00'
      },
      feature_flags: {
        advanced_reporting: true,
        bulk_operations: true,
        api_access: false
      }
    }
  }
}
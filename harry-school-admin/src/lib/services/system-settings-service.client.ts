'use client'

import { useState, useEffect } from 'react'

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

export class SystemSettingsClientService {
  /**
   * Get system settings client-side via API
   */
  static async getSettingsClient(): Promise<SystemSettings> {
    try {
      const response = await fetch('/api/settings/system')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching system settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Check if a feature flag is enabled (client-side)
   */
  static async isFeatureEnabledClient(
    feature: keyof SystemSettings['feature_flags']
  ): Promise<boolean> {
    const settings = await this.getSettingsClient()
    return settings.feature_flags[feature]
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

// Hook for client-side usage
export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const systemSettings = await SystemSettingsClientService.getSettingsClient()
      setSettings(systemSettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      setSettings(SystemSettingsClientService.getDefaultSettings())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return { settings, isLoading, error, refresh: fetchSettings }
}

// Feature flag hook
export function useFeatureFlag(feature: keyof SystemSettings['feature_flags']) {
  const { settings } = useSystemSettings()
  return settings?.feature_flags[feature] ?? false
}
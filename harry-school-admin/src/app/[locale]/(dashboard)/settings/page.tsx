'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LanguageSwitch } from '@/components/ui/language-switch'
import { useParams } from 'next/navigation'
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  Globe,
  Clock,
  DollarSign 
} from 'lucide-react'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const params = useParams()
  const locale = params?.locale as string || 'en'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('generalSettings')}
            </CardTitle>
            <CardDescription>
              System preferences and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{t('language')}</span>
              </div>
              <LanguageSwitch currentLocale={locale} variant="default" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{t('timezone')}</span>
              </div>
              <span className="text-sm text-muted-foreground">UTC+5 (Tashkent)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{t('currency')}</span>
              </div>
              <span className="text-sm text-muted-foreground">UZS</span>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('userManagement')}
            </CardTitle>
            <CardDescription>
              Manage admin users and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">2 admin users</p>
              <p className="text-sm text-muted-foreground">1 super admin</p>
              <Button variant="outline" size="sm" className="mt-4">
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('security')}
            </CardTitle>
            <CardDescription>
              Security settings and authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">Session management</p>
              <Button variant="outline" size="sm" className="mt-4">
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('systemPreferences')}
            </CardTitle>
            <CardDescription>
              System configuration and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Database optimization</p>
              <p className="text-sm text-muted-foreground">Cache management</p>
              <Button variant="outline" size="sm" className="mt-4">
                System Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications')}
            </CardTitle>
            <CardDescription>
              Email and system notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email notifications enabled</p>
              <p className="text-sm text-muted-foreground">System alerts active</p>
              <Button variant="outline" size="sm" className="mt-4">
                Configure Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('backup')}
            </CardTitle>
            <CardDescription>
              Data backup and recovery options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
              <p className="text-sm text-muted-foreground">Automatic backups enabled</p>
              <Button variant="outline" size="sm" className="mt-4">
                Backup Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitch } from '@/components/ui/language-switch'
import { LogoutButton } from '@/components/auth/logout-button'
import { NotificationBell } from '@/components/admin/notifications/notification-bell'
import { User, Wrench } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSystemSettings } from '@/lib/services/system-settings-service.client'
import Link from 'next/link'

export function Header() {
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const t = useTranslations('navigation')
  const { settings } = useSystemSettings()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">{t('adminDashboard')}</h2>
        {settings?.maintenance_mode && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            Maintenance Mode
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <LanguageSwitch currentLocale={locale} variant="minimal" />
        <NotificationBell />
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/profile`}>
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <LogoutButton 
            variant="ghost" 
            size="icon" 
            showText={false}
          />
        </div>
      </div>
    </header>
  )
}
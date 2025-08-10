'use client'

import { Button } from '@/components/ui/button'
import { LanguageSwitch } from '@/components/ui/language-switch'
import { LogoutButton } from '@/components/auth/logout-button'
import { Bell, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function Header() {
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const t = useTranslations('navigation')

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">{t('adminDashboard')}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <LanguageSwitch currentLocale={locale} variant="minimal" />
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        
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
'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Users, GraduationCap, UserCheck, Settings, BookOpen, Award, Trophy, Medal, Gift } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const t = useTranslations('common')

  const navigation = [
    { name: t('dashboard'), href: `/${locale}`, icon: GraduationCap },
    { name: t('teachers'), href: `/${locale}/teachers`, icon: UserCheck },
    { name: t('groups'), href: `/${locale}/groups`, icon: BookOpen },
    { name: t('students'), href: `/${locale}/students`, icon: Users },
    { name: t('rankings'), href: `/${locale}/rankings`, icon: Trophy },
    { name: t('settings'), href: `/${locale}/settings`, icon: Settings },
  ]

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-semibold text-primary">Harry School</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          // Check if current path matches this navigation item
          const isActive = pathname === item.href || 
            (item.href !== `/${locale}` && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useSmartPrefetcher } from '@/lib/utils/route-prefetcher'
import { Users, GraduationCap, UserCheck, Settings, BookOpen, Award, Trophy, Medal, Gift } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const t = useTranslations('common')
  const { smartPrefetch } = useSmartPrefetcher()

  const navigation = [
    { name: t('dashboard'), href: `/${locale}`, icon: GraduationCap, prefetchKey: 'dashboard' },
    { name: t('teachers'), href: `/${locale}/teachers`, icon: UserCheck, prefetchKey: 'teachers' },
    { name: t('groups'), href: `/${locale}/groups`, icon: BookOpen, prefetchKey: 'groups' },
    { name: t('students'), href: `/${locale}/students`, icon: Users, prefetchKey: 'students' },
    { name: t('rankings'), href: `/${locale}/rankings`, icon: Trophy, prefetchKey: 'rankings' },
    { name: t('settings'), href: `/${locale}/settings`, icon: Settings, prefetchKey: 'settings' },
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
              onMouseEnter={() => {
                // OPTIMIZED: Smart prefetch on hover for instant navigation
                if (!isActive && item.prefetchKey) {
                  smartPrefetch(item.prefetchKey)
                }
              }}
              onFocus={() => {
                // OPTIMIZED: Also prefetch on keyboard focus for accessibility
                if (!isActive && item.prefetchKey) {
                  smartPrefetch(item.prefetchKey)
                }
              }}
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
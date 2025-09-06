'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X, Users, GraduationCap, UserCheck, Settings, BookOpen, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSmartPrefetcher } from '@/lib/utils/route-prefetcher'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
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

  const handleLinkClick = (prefetchKey: string) => {
    if (prefetchKey) {
      smartPrefetch(prefetchKey)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/25 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 max-w-xs bg-card shadow-xl transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <h1 className="text-xl font-semibold text-primary">Harry School</h1>
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== `/${locale}` && pathname.startsWith(item.href + '/'))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => handleLinkClick(item.prefetchKey)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
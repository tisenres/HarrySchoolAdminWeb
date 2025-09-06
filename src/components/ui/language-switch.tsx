'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Check, ChevronDown, Globe, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbek', flag: '🇺🇿' },
]

interface LanguageSwitchProps {
  currentLocale?: string
  variant?: 'default' | 'minimal'
  className?: string
}

export function LanguageSwitch({ 
  currentLocale, 
  variant = 'default',
  className 
}: LanguageSwitchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const activeLocale = currentLocale || locale
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('common')

  const currentLanguage = languages.find(lang => lang.code === activeLocale) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    if (langCode === activeLocale) return
    
    setIsOpen(false)
    
    startTransition(() => {
      // Replace the current locale in the pathname with the new one
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
      const newPath = `/${langCode}${pathWithoutLocale}`
      
      // Use replace instead of push to avoid page refresh
      router.replace(newPath)
    })
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full hover:bg-accent",
              className
            )}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="sr-only">{t('changeLanguage')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                activeLocale === language.code && "bg-accent",
                isPending && "opacity-50 cursor-not-allowed"
              )}
              disabled={isPending}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm">{language.nativeName}</span>
              </div>
              {activeLocale === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "flex items-center gap-2 min-w-[120px] justify-between",
            className
          )}
          disabled={isPending}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{currentLanguage.flag}</span>
            <span className="text-sm font-medium hidden sm:inline">
              {currentLanguage.nativeName}
            </span>
            <span className="text-sm font-medium sm:hidden">
              {currentLanguage.code.toUpperCase()}
            </span>
          </div>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer px-3 py-2",
              activeLocale === language.code && "bg-accent",
              isPending && "opacity-50 cursor-not-allowed"
            )}
            disabled={isPending}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{language.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{language.nativeName}</span>
                <span className="text-xs text-muted-foreground">{language.name}</span>
              </div>
            </div>
            {activeLocale === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
import { LanguageSwitch } from '@/components/ui/language-switch'
import LoginForm from './login-form'

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitch currentLocale={locale} variant="minimal" />
      </div>
      <LoginForm />
    </div>
  )
}

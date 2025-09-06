'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle,
  Loader2,
  GraduationCap,
  Eye,
  EyeOff
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Form validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tLogin = useTranslations('loginForm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)

  // Create validation schema with translations
  const validationSchema = z.object({
    email: z.string().email(tLogin('validation.invalidEmail')),
    password: z.string().min(6, tLogin('validation.passwordTooShort')),
  })

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  )

  async function onSubmit(values: LoginFormValues) {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data?.user) {
        // Redirect to dashboard - profile check will be done by middleware
        router.push('/en')
        router.refresh()
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(tLogin('errors.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  // Fill test credentials for development
  const fillTestCredentials = () => {
    form.setValue('email', 'admin@harryschool.uz')
    form.setValue('password', 'Admin123!')
    setIsTestMode(true)
  }

  // Create test admin account (for development only)
  const createTestAdmin = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@harryschool.uz',
        password: 'Admin123!',
        options: {
          data: {
            full_name: 'Test Admin',
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (authData?.user) {
        // Create profile for the user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: 'admin@harryschool.uz',
            full_name: 'Test Admin',
            role: 'admin',
            organization_id: '550e8400-e29b-41d4-a716-446655440000', // Default org
            is_active: true,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError(tLogin('errors.failedToCreateProfile'))
        } else {
          setError(null)
          alert(tLogin('success.adminCreated'))
          fillTestCredentials()
        }
      }
    } catch (err) {
      console.error('Error creating test admin:', err)
      setError(tLogin('errors.failedToCreateAdmin'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center" style={{ backgroundColor: 'rgba(29, 116, 82, 0.1)' }}>
              <GraduationCap className="h-6 w-6 text-primary" style={{ color: '#1d7452' }} />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">
            {tLogin('harrySchoolAdmin')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('signInToContinue')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder={tLogin('emailPlaceholder')}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('password')}
                          className="pl-10 pr-10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                  style={{ color: '#1d7452' }}
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
                style={{ backgroundColor: '#1d7452' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('signIn')}...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('signInButton')}
                  </>
                )}
              </Button>

              {/* Development Only - Test Options */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      {t('developmentTools')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fillTestCredentials}
                        disabled={loading}
                      >
                        {t('testCredentials')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={createTestAdmin}
                        disabled={loading}
                      >
                        {t('createTestAdmin')}
                      </Button>
                    </div>
                    {isTestMode && (
                      <Alert>
                      <AlertDescription className="text-xs">
                      {tLogin('testCredentialsFilled')}
                      </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p>{tLogin('copyright')}</p>
          <p>{tLogin('adminAccessOnly')}</p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
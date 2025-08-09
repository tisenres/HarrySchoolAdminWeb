'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { ClientOnly } from '@/components/ui/client-only'
import {
  Loader2,
  Shield,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Smartphone,
  Lock,
  Unlock,
  UserX,
  Activity,
  Globe,
  Trash2
} from 'lucide-react'

const securitySettingsSchema = z.object({
  password_policy: z.object({
    min_length: z.number().min(6).max(32),
    require_uppercase: z.boolean(),
    require_lowercase: z.boolean(),
    require_numbers: z.boolean(),
    require_symbols: z.boolean(),
    password_expiry_days: z.number().min(0).max(365).optional(),
    password_history_count: z.number().min(0).max(10).optional()
  }),
  session_management: z.object({
    session_timeout: z.number().min(15).max(1440),
    max_concurrent_sessions: z.number().min(1).max(10),
    remember_me_duration: z.number().min(1).max(90),
    force_logout_on_password_change: z.boolean()
  }),
  two_factor_auth: z.object({
    require_2fa: z.boolean(),
    allow_backup_codes: z.boolean(),
    backup_codes_count: z.number().min(5).max(20)
  }),
  login_security: z.object({
    max_login_attempts: z.number().min(3).max(10),
    lockout_duration_minutes: z.number().min(5).max(1440),
    require_captcha_after_attempts: z.number().min(2).max(5),
    notify_failed_login: z.boolean()
  }),
  ip_restrictions: z.object({
    enable_ip_whitelist: z.boolean(),
    allowed_ips: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Invalid IP address")).optional()
  }),
  audit_settings: z.object({
    log_login_attempts: z.boolean(),
    log_data_changes: z.boolean(),
    log_admin_actions: z.boolean(),
    retention_days: z.number().min(30).max(2555) // 7 years max
  })
})

type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>

interface ActiveSession {
  id: string
  user_id: string
  user_name: string
  ip_address: string
  user_agent: string
  last_activity: string
  created_at: string
  is_current: boolean
}

interface SecurityEvent {
  id: string
  event_type: 'login_success' | 'login_failed' | 'password_change' | 'account_locked' | '2fa_enabled' | '2fa_disabled'
  user_id: string
  user_name: string
  ip_address: string
  details: string
  created_at: string
}

interface SecuritySettingsProps {
  organizationId: string
}

export function SecuritySettings({ organizationId }: SecuritySettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [showIPInput, setShowIPInput] = useState(false)
  const [newIP, setNewIP] = useState('')

  const form = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: false,
        password_expiry_days: 90,
        password_history_count: 3
      },
      session_management: {
        session_timeout: 480,
        max_concurrent_sessions: 3,
        remember_me_duration: 30,
        force_logout_on_password_change: true
      },
      two_factor_auth: {
        require_2fa: false,
        allow_backup_codes: true,
        backup_codes_count: 10
      },
      login_security: {
        max_login_attempts: 5,
        lockout_duration_minutes: 30,
        require_captcha_after_attempts: 3,
        notify_failed_login: true
      },
      ip_restrictions: {
        enable_ip_whitelist: false,
        allowed_ips: []
      },
      audit_settings: {
        log_login_attempts: true,
        log_data_changes: true,
        log_admin_actions: true,
        retention_days: 365
      }
    },
  })

  useEffect(() => {
    fetchSecuritySettings()
    fetchActiveSessions()
    fetchSecurityEvents()
  }, [organizationId])

  const fetchSecuritySettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/settings/security?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          form.reset(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching security settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load security settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch(`/api/settings/security/sessions?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setActiveSessions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error)
    }
  }

  const fetchSecurityEvents = async () => {
    try {
      const response = await fetch(`/api/settings/security/events?organizationId=${organizationId}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setSecurityEvents(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching security events:', error)
    }
  }

  const onSubmit = async (data: SecuritySettingsFormValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationId
        }),
      })

      if (!response.ok) throw new Error('Failed to update security settings')

      toast({
        title: 'Success',
        description: 'Security settings updated successfully',
      })
    } catch (error) {
      console.error('Error updating security settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update security settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/settings/security/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, organizationId }),
      })

      if (!response.ok) throw new Error('Failed to revoke session')

      toast({
        title: 'Success',
        description: 'Session revoked successfully',
      })

      fetchActiveSessions()
    } catch (error) {
      console.error('Error revoking session:', error)
      toast({
        title: 'Error',
        description: 'Failed to revoke session',
        variant: 'destructive',
      })
    }
  }

  const addAllowedIP = () => {
    if (newIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(newIP)) {
      const currentIPs = form.getValues('ip_restrictions.allowed_ips') || []
      if (!currentIPs.includes(newIP)) {
        form.setValue('ip_restrictions.allowed_ips', [...currentIPs, newIP])
        setNewIP('')
      }
    }
  }

  const removeAllowedIP = (ip: string) => {
    const currentIPs = form.getValues('ip_restrictions.allowed_ips') || []
    form.setValue('ip_restrictions.allowed_ips', currentIPs.filter(i => i !== ip))
  }

  const getEventBadge = (eventType: string) => {
    const config = {
      login_success: { variant: 'default' as const, icon: Unlock },
      login_failed: { variant: 'destructive' as const, icon: Lock },
      password_change: { variant: 'outline' as const, icon: Key },
      account_locked: { variant: 'destructive' as const, icon: UserX },
      '2fa_enabled': { variant: 'default' as const, icon: Smartphone },
      '2fa_disabled': { variant: 'secondary' as const, icon: Smartphone }
    }

    const { variant, icon: Icon } = config[eventType as keyof typeof config] || { variant: 'outline' as const, icon: Activity }
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {eventType.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-muted-foreground">
          Configure security policies, authentication, and access controls.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Policy
              </CardTitle>
              <CardDescription>
                Configure password requirements and security standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password_policy.min_length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Password Length</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={6}
                        max={32}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum number of characters required (6-32)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="password_policy.require_uppercase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">Uppercase</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_policy.require_lowercase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">Lowercase</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_policy.require_numbers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">Numbers</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_policy.require_symbols"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">Symbols</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password_policy.password_expiry_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Expiry (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={365}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        0 = never expire, max 365 days
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_policy.password_history_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password History</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Prevent reuse of last N passwords
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Configure multi-factor authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="two_factor_auth.require_2fa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Require 2FA</FormLabel>
                      <FormDescription>
                        Require all users to enable two-factor authentication
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="two_factor_auth.allow_backup_codes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Backup Codes</FormLabel>
                      <FormDescription>
                        Allow users to generate backup recovery codes
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('two_factor_auth.allow_backup_codes') && (
                <FormField
                  control={form.control}
                  name="two_factor_auth.backup_codes_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backup Codes Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={20}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of backup codes to generate (5-20)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Login Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Login Security
              </CardTitle>
              <CardDescription>
                Configure login attempt limits and security measures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="login_security.max_login_attempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Login Attempts</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={3}
                          max={10}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Lock account after failed attempts (3-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="login_security.lockout_duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lockout Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={1440}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Account lockout duration (5-1440 minutes)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="login_security.require_captcha_after_attempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Captcha After Attempts</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={5}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Show captcha after N failed attempts (2-5)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="login_security.notify_failed_login"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Notify Failed Logins</FormLabel>
                      <FormDescription>
                        Send notifications for failed login attempts
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* IP Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IP Restrictions
              </CardTitle>
              <CardDescription>
                Configure IP-based access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ip_restrictions.enable_ip_whitelist"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable IP Whitelist</FormLabel>
                      <FormDescription>
                        Only allow access from specified IP addresses
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('ip_restrictions.enable_ip_whitelist') && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="192.168.1.100"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                    <Button type="button" onClick={addAllowedIP}>Add IP</Button>
                  </div>

                  <div className="space-y-2">
                    {(form.watch('ip_restrictions.allowed_ips') || []).map((ip, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="font-mono text-sm">{ip}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAllowedIP(ip)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Security Settings
          </Button>
        </form>
      </Form>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Monitor and manage active user sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active sessions found
                  </TableCell>
                </TableRow>
              ) : (
                activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {session.user_name}
                        {session.is_current && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.ip_address}
                    </TableCell>
                    <TableCell>
                      <ClientOnly fallback="Loading...">
                        {new Date(session.last_activity).toLocaleString()}
                      </ClientOnly>
                    </TableCell>
                    <TableCell>
                      <ClientOnly fallback="Loading...">
                        {Math.round((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60))} min
                      </ClientOnly>
                    </TableCell>
                    <TableCell className="text-right">
                      {!session.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeSession(session.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Monitor security events and login activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No security events recorded
                  </TableCell>
                </TableRow>
              ) : (
                securityEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      {getEventBadge(event.event_type)}
                    </TableCell>
                    <TableCell>{event.user_name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.ip_address}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.details}
                    </TableCell>
                    <TableCell>
                      <ClientOnly fallback="Loading...">
                        {new Date(event.created_at).toLocaleString()}
                      </ClientOnly>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
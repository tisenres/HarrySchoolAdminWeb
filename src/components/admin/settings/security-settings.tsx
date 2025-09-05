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
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Shield,
  Key,
  Clock,
  Smartphone,
  Globe,
  Activity,
  UserX,
  AlertTriangle
} from 'lucide-react'

const securitySettingsSchema = z.object({
  // Password policy
  password_min_length: z.number().min(6).max(32).optional(),
  password_require_uppercase: z.boolean().optional(),
  password_require_lowercase: z.boolean().optional(),
  password_require_numbers: z.boolean().optional(),
  password_require_symbols: z.boolean().optional(),
  password_expiry_days: z.number().min(0).max(365).optional(),
  password_history_count: z.number().min(0).max(10).optional(),
  
  // Session management
  session_timeout_minutes: z.number().min(15).max(1440).optional(),
  max_login_attempts: z.number().min(3).max(10).optional(),
  lockout_duration_minutes: z.number().min(5).max(1440).optional(),
  require_captcha_after_attempts: z.number().min(2).max(5).optional(),
  
  // Two-factor authentication
  require_2fa: z.boolean().optional(),
  allow_backup_codes: z.boolean().optional(),
  backup_codes_count: z.number().min(5).max(20).optional(),
  
  // IP restrictions
  ip_whitelist_enabled: z.boolean().optional(),
  allowed_ips: z.array(z.string()).optional()
})

type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>

interface ActiveSession {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  ip_address: string
  user_agent: string
  location?: string
  last_activity: string
  duration: string
  expires_at: string
  created_at: string
}

interface SecurityEvent {
  id: string
  event_type: string
  user: {
    id: string
    name: string
    email: string
  } | null
  ip_address?: string
  user_agent?: string
  details: any
  severity: string
  created_at: string
}

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [showIPInput, setShowIPInput] = useState(false)
  const [newIP, setNewIP] = useState('')

  const form = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      password_expiry_days: 90,
      password_history_count: 3,
      session_timeout_minutes: 480,
      max_login_attempts: 5,
      lockout_duration_minutes: 30,
      require_captcha_after_attempts: 3,
      require_2fa: false,
      allow_backup_codes: true,
      backup_codes_count: 10,
      ip_whitelist_enabled: false,
      allowed_ips: []
    },
  })

  useEffect(() => {
    fetchSecuritySettings()
    fetchActiveSessions()
    fetchSecurityEvents()
  }, [])

  const fetchSecuritySettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/security')
      if (response.ok) {
        const data = await response.json()
        form.reset(data)
      } else {
        throw new Error('Failed to fetch security settings')
      }
    } catch (error) {
      console.error('Error fetching security settings:', error)
      toast.error('Failed to load security settings')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/settings/security/sessions')
      if (response.ok) {
        const data = await response.json()
        setActiveSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error)
    }
  }

  const fetchSecurityEvents = async () => {
    try {
      const response = await fetch('/api/settings/security/events?limit=20')
      if (response.ok) {
        const data = await response.json()
        setSecurityEvents(data.events || [])
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
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update security settings')
      }

      toast.success('Security settings updated successfully')
    } catch (error: any) {
      console.error('Error updating security settings:', error)
      toast.error(error.message || 'Failed to update security settings')
    } finally {
      setIsSaving(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settings/security/sessions?sessionId=${sessionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to revoke session')
      }

      toast.success('Session revoked successfully')

      fetchActiveSessions()
    } catch (error: any) {
      console.error('Error revoking session:', error)
      toast.error(error.message || 'Failed to revoke session')
    }
  }

  const addIPToWhitelist = () => {
    if (!newIP) return
    
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    if (!ipRegex.test(newIP)) {
      toast.error('Please enter a valid IP address')
      return
    }

    const currentIPs = form.getValues('allowed_ips') || []
    if (currentIPs.includes(newIP)) {
      toast.error('IP address already in whitelist')
      return
    }

    form.setValue('allowed_ips', [...currentIPs, newIP])
    setNewIP('')
    setShowIPInput(false)
  }

  const removeIPFromWhitelist = (ipToRemove: string) => {
    const currentIPs = form.getValues('allowed_ips') || []
    form.setValue('allowed_ips', currentIPs.filter(ip => ip !== ipToRemove))
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'warning':
        return <Badge variant="outline">Warning</Badge>
      case 'info':
        return <Badge variant="secondary">Info</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
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
                Configure password requirements and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password_min_length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Password Length</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={6} 
                          max={32} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Minimum characters required</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_expiry_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Expiry (days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={365} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>0 = never expires</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password_require_uppercase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Require Uppercase
                        </FormLabel>
                        <FormDescription>
                          At least one uppercase letter
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
                  name="password_require_lowercase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Require Lowercase
                        </FormLabel>
                        <FormDescription>
                          At least one lowercase letter
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
                  name="password_require_numbers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Require Numbers
                        </FormLabel>
                        <FormDescription>
                          At least one number
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
                  name="password_require_symbols"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Require Symbols
                        </FormLabel>
                        <FormDescription>
                          At least one special character
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
              </div>
            </CardContent>
          </Card>

          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Management
              </CardTitle>
              <CardDescription>
                Configure user session timeouts and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="session_timeout_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Timeout (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={15} 
                          max={1440} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Auto-logout after inactivity</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_login_attempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Login Attempts</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={3} 
                          max={10} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Before account lockout</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lockout_duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lockout Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={5} 
                          max={1440} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Account lockout duration</FormDescription>
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
                Configure 2FA requirements and backup codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="require_2fa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require 2FA for all users
                      </FormLabel>
                      <FormDescription>
                        Force all users to enable two-factor authentication
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="allow_backup_codes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Backup Codes
                        </FormLabel>
                        <FormDescription>
                          Generate backup codes for 2FA recovery
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
                  name="backup_codes_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Backup Codes</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={5} 
                          max={20} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Codes to generate per user</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                Control access from specific IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ip_whitelist_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable IP Whitelist
                      </FormLabel>
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

              {form.watch('ip_whitelist_enabled') && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      {showIPInput ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="192.168.1.1"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                          />
                          <Button type="button" onClick={addIPToWhitelist}>Add</Button>
                          <Button type="button" variant="outline" onClick={() => setShowIPInput(false)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button type="button" variant="outline" onClick={() => setShowIPInput(true)}>
                          Add IP Address
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {form.watch('allowed_ips')?.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-mono">{ip}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIPFromWhitelist(ip)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving}>
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
            Current active user sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No active sessions
                  </TableCell>
                </TableRow>
              ) : (
                activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{session.user.name}</p>
                        <p className="text-sm text-muted-foreground">{session.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{session.ip_address}</TableCell>
                    <TableCell>{session.location || 'Unknown'}</TableCell>
                    <TableCell>{session.duration}</TableCell>
                    <TableCell>{new Date(session.last_activity).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                      >
                        <UserX className="h-4 w-4" />
                        Revoke
                      </Button>
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
            <Shield className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest security-related activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No security events
                  </TableCell>
                </TableRow>
              ) : (
                securityEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.event_type.replace(/_/g, ' ')}</p>
                        {event.details && (
                          <p className="text-sm text-muted-foreground">
                            {typeof event.details === 'string' ? event.details : JSON.stringify(event.details)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.user ? (
                        <div>
                          <p className="font-medium">{event.user.name}</p>
                          <p className="text-sm text-muted-foreground">{event.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{event.ip_address || 'N/A'}</TableCell>
                    <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                    <TableCell>{new Date(event.created_at).toLocaleString()}</TableCell>
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
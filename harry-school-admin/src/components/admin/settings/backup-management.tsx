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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { ClientOnly } from '@/components/ui/client-only'
import {
  Loader2,
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  HardDrive,
  Cloud,
  RotateCcw,
  Play,
  Pause,
  Settings
} from 'lucide-react'

const backupSettingsSchema = z.object({
  automated_backups: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    retention_days: z.number().min(7).max(365),
    include_attachments: z.boolean()
  }),
  backup_location: z.object({
    type: z.enum(['local', 'cloud', 'both']),
    cloud_provider: z.string().optional(),
    encryption_enabled: z.boolean()
  }),
  notification_settings: z.object({
    notify_on_success: z.boolean(),
    notify_on_failure: z.boolean(),
    notification_emails: z.array(z.string().email()).optional()
  }),
  advanced_settings: z.object({
    compress_backups: z.boolean(),
    backup_verification: z.boolean(),
    parallel_processing: z.boolean(),
    max_backup_size_gb: z.number().min(1).max(1000)
  })
})

type BackupSettingsFormValues = z.infer<typeof backupSettingsSchema>

interface BackupRecord {
  id: string
  name: string
  type: 'automated' | 'manual'
  status: 'completed' | 'failed' | 'in_progress' | 'pending'
  size_bytes: number
  created_at: string
  completed_at?: string
  error_message?: string
  file_path: string
  includes_attachments: boolean
}

interface BackupStatistics {
  total_backups: number
  successful_backups: number
  failed_backups: number
  total_size_bytes: number
  last_successful_backup?: string
  next_scheduled_backup?: string
  average_backup_time_minutes: number
  storage_usage_percentage: number
}

interface BackupManagementProps {
  organizationId: string
}

export function BackupManagement({ organizationId }: BackupManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)

  const form = useForm<BackupSettingsFormValues>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      automated_backups: {
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retention_days: 30,
        include_attachments: true
      },
      backup_location: {
        type: 'local',
        encryption_enabled: true
      },
      notification_settings: {
        notify_on_success: false,
        notify_on_failure: true,
        notification_emails: []
      },
      advanced_settings: {
        compress_backups: true,
        backup_verification: true,
        parallel_processing: false,
        max_backup_size_gb: 50
      }
    },
  })

  useEffect(() => {
    fetchBackupSettings()
    fetchBackups()
    fetchStatistics()
  }, [organizationId])

  const fetchBackupSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/settings/backup?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          form.reset(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching backup settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load backup settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await fetch(`/api/settings/backup/history?organizationId=${organizationId}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setBackups(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching backup history:', error)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/settings/backup/statistics?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setStatistics(data.data)
      }
    } catch (error) {
      console.error('Error fetching backup statistics:', error)
    }
  }

  const onSubmit = async (data: BackupSettingsFormValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationId
        }),
      })

      if (!response.ok) throw new Error('Failed to update backup settings')

      toast({
        title: 'Success',
        description: 'Backup settings updated successfully',
      })

      fetchStatistics()
    } catch (error) {
      console.error('Error updating backup settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update backup settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const createManualBackup = async () => {
    setIsCreatingBackup(true)
    setBackupProgress(0)
    
    try {
      const response = await fetch('/api/settings/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, type: 'manual' }),
      })

      if (!response.ok) throw new Error('Failed to create backup')

      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 500)

      setTimeout(() => {
        clearInterval(progressInterval)
        setBackupProgress(100)
        toast({
          title: 'Success',
          description: 'Manual backup created successfully',
        })
        fetchBackups()
        fetchStatistics()
        setIsCreatingBackup(false)
        setBackupProgress(0)
      }, 5000)

    } catch (error) {
      console.error('Error creating backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive',
      })
      setIsCreatingBackup(false)
      setBackupProgress(0)
    }
  }

  const downloadBackup = async (backupId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/settings/backup/download?backupId=${backupId}&organizationId=${organizationId}`)
      
      if (!response.ok) throw new Error('Failed to download backup')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Success',
        description: 'Backup download started',
      })
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to download backup',
        variant: 'destructive',
      })
    }
  }

  const restoreFromBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This action cannot be undone and will replace current data.')) {
      return
    }

    try {
      const response = await fetch('/api/settings/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId, organizationId }),
      })

      if (!response.ok) throw new Error('Failed to restore backup')

      toast({
        title: 'Success',
        description: 'Restore process initiated. This may take several minutes.',
      })
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore backup',
        variant: 'destructive',
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { variant: 'default' as const, icon: CheckCircle },
      failed: { variant: 'destructive' as const, icon: XCircle },
      in_progress: { variant: 'outline' as const, icon: Loader2 },
      pending: { variant: 'secondary' as const, icon: Clock }
    }
    
    const { variant, icon: Icon } = config[status as keyof typeof config] || { variant: 'outline' as const, icon: AlertTriangle }
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
        {status.replace('_', ' ').toUpperCase()}
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
        <h2 className="text-2xl font-bold">Backup Management</h2>
        <p className="text-muted-foreground">
          Configure automated backups, manage backup history, and restore data.
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_backups}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.successful_backups} successful, {statistics.failed_backups} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(statistics.total_size_bytes)}</div>
              <Progress value={statistics.storage_usage_percentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                <ClientOnly fallback="Loading...">
                  {statistics.last_successful_backup 
                    ? new Date(statistics.last_successful_backup).toLocaleDateString()
                    : 'Never'
                  }
                </ClientOnly>
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {statistics.average_backup_time_minutes} min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Backup</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                <ClientOnly fallback="Loading...">
                  {statistics.next_scheduled_backup 
                    ? new Date(statistics.next_scheduled_backup).toLocaleDateString()
                    : 'Not scheduled'
                  }
                </ClientOnly>
              </div>
              <p className="text-xs text-muted-foreground">
                {form.watch('automated_backups.enabled') ? 'Automated' : 'Disabled'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manual Backup
          </CardTitle>
          <CardDescription>
            Create an immediate backup of your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreatingBackup && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Creating backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          )}
          
          <Button 
            onClick={createManualBackup} 
            disabled={isCreatingBackup}
            className="w-full"
          >
            {isCreatingBackup ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Create Manual Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup Settings Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Automated Backups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automated Backup Settings
              </CardTitle>
              <CardDescription>
                Configure automatic backup scheduling and retention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="automated_backups.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Automated Backups</FormLabel>
                      <FormDescription>
                        Automatically create backups on a regular schedule
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

              {form.watch('automated_backups.enabled') && (
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="automated_backups.frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="automated_backups.time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Time to run automated backups
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="automated_backups.retention_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retention Period (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={7}
                            max={365}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How long to keep backups (7-365 days)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="automated_backups.include_attachments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Attachments</FormLabel>
                      <FormDescription>
                        Include uploaded files and attachments in backups
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

          {/* Backup Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Storage Settings
              </CardTitle>
              <CardDescription>
                Configure where backups are stored and security options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="backup_location.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select storage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="local">Local Storage</SelectItem>
                        <SelectItem value="cloud">Cloud Storage</SelectItem>
                        <SelectItem value="both">Both Local and Cloud</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="backup_location.encryption_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Encryption</FormLabel>
                      <FormDescription>
                        Encrypt backup files for enhanced security
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

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Backup Settings
          </Button>
        </form>
      </Form>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            View and manage previous backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Database className="h-8 w-8 text-muted-foreground" />
                      No backups found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell>
                      <Badge variant={backup.type === 'automated' ? 'default' : 'outline'}>
                        {backup.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>{formatFileSize(backup.size_bytes)}</TableCell>
                    <TableCell>
                      <ClientOnly fallback="Loading...">
                        {new Date(backup.created_at).toLocaleDateString()}
                      </ClientOnly>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadBackup(backup.id, backup.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreFromBackup(backup.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {backup.status === 'failed' && backup.error_message && (
                          <span className="text-xs text-destructive" title={backup.error_message}>
                            Error
                          </span>
                        )}
                      </div>
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
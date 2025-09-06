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
import { toast } from 'sonner'
import {
  Loader2,
  Database,
  Download,
  Upload,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Trash2,
  Calendar
} from 'lucide-react'

const backupSettingsSchema = z.object({
  automated_backups: z.boolean().optional(),
  backup_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  backup_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  backup_retention_days: z.number().min(7).max(365).optional(),
  include_attachments: z.boolean().optional()
})

type BackupSettingsFormValues = z.infer<typeof backupSettingsSchema>

interface BackupStatistics {
  total_backups: number
  completed_backups: number
  total_size_bytes: number
  last_backup: {
    completed_at: string
    status: string
    file_size: number
  } | null
  next_backup: string | null
}

interface BackupHistory {
  id: string
  name: string
  type: 'manual' | 'automated'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  file_size?: number
  file_size_mb?: number
  file_path?: string
  tables_included: string[]
  error_message?: string
  created_by?: {
    name: string
    email: string
  }
  created_at: string
  completed_at?: string
  duration?: string
}

export function BackupManagement() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null)
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const form = useForm<BackupSettingsFormValues>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      automated_backups: true,
      backup_frequency: 'daily',
      backup_time: '02:00',
      backup_retention_days: 30,
      include_attachments: true
    },
  })

  useEffect(() => {
    fetchBackupSettings()
    fetchBackupHistory()
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  const fetchBackupSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/backup')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          form.reset(data.settings)
        }
        if (data.statistics) {
          setStatistics(data.statistics)
        }
      } else {
        throw new Error('Failed to fetch backup settings')
      }
    } catch (error) {
      console.error('Error fetching backup settings:', error)
      toast.error('Failed to load backup settings')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBackupHistory = async () => {
    try {
      const response = await fetch('/api/settings/backup/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        setBackupHistory(data.backups || [])
      }
    } catch (error) {
      console.error('Error fetching backup history:', error)
    }
  }

  const onSubmit = async (data: BackupSettingsFormValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update backup settings')
      }

      toast.success('Backup settings updated successfully')

      fetchBackupSettings()
    } catch (error: any) {
      console.error('Error updating backup settings:', error)
      toast.error(error.message || 'Failed to update backup settings')
    } finally {
      setIsSaving(false)
    }
  }

  const createManualBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const backupData = {
        name: `Manual Backup ${new Date().toLocaleDateString()}`,
        description: 'Manual backup created from settings',
        options: {
          includeProfiles: true,
          includeTeachers: true,
          includeStudents: true,
          includeGroups: true,
          includeOrganizationSettings: true,
          compression: true
        }
      }

      const response = await fetch('/api/settings/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create backup')
      }

      const data = await response.json()
      toast.success(data.message || 'Backup started successfully', {
        description: 'Real database backup in progress. This will export all your organization data.'
      })

      // Start polling for backup updates
      startBackupStatusPolling()
    } catch (error: any) {
      console.error('Error creating manual backup:', error)
      toast.error(error.message || 'Failed to create manual backup')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const startBackupStatusPolling = () => {
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    // Poll every 2 seconds for updates
    const interval = setInterval(async () => {
      try {
        await fetchBackupHistory()
        await fetchBackupSettings()
        
        // Check if any backup is still in progress
        const freshHistory = await fetch('/api/settings/backup/history?limit=10').then(r => r.json())
        const hasInProgressBackup = freshHistory.backups?.some((backup: BackupHistory) => 
          backup.status === 'pending' || backup.status === 'in_progress'
        )
        
        if (!hasInProgressBackup) {
          clearInterval(interval)
          setRefreshInterval(null)
        }
      } catch (error) {
        console.error('Error polling backup status:', error)
        clearInterval(interval)
        setRefreshInterval(null)
      }
    }, 2000)

    setRefreshInterval(interval)
  }

  const downloadBackup = async (backupId: string, backupName: string) => {
    try {
      const response = await fetch(`/api/settings/backup/download/${backupId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to download backup')
      }

      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `${backupName}.zip`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Backup downloaded successfully')
    } catch (error: any) {
      console.error('Error downloading backup:', error)
      toast.error(error.message || 'Failed to download backup')
    }
  }

  const deleteBackupRecord = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup record?')) return

    try {
      const response = await fetch(`/api/settings/backup/history?backupId=${backupId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete backup record')
      }

      toast.success('Backup record deleted successfully')

      fetchBackupHistory()
      fetchBackupSettings()
    } catch (error: any) {
      console.error('Error deleting backup record:', error)
      toast.error(error.message || 'Failed to delete backup record')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          In Progress
        </Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Backups</p>
                    <p className="text-2xl font-bold">{statistics.total_backups}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold">{statistics.completed_backups}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Size</p>
                    <p className="text-2xl font-bold">{formatFileSize(statistics.total_size_bytes)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    <p className="text-sm font-medium">
                      {statistics.last_backup 
                        ? new Date(statistics.last_backup.completed_at).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Configuration
            </CardTitle>
            <CardDescription>
              Configure automated backup settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="automated_backups"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Automated Backups
                        </FormLabel>
                        <FormDescription>
                          Automatically create backups on schedule
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

                {form.watch('automated_backups') && (
                  <>
                    <FormField
                      control={form.control}
                      name="backup_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Backup Frequency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      name="backup_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Backup Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>
                            Time when automated backups should run
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="backup_retention_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retention Period (days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={7} 
                          max={365} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How long to keep backup files
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="include_attachments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Include Attachments
                        </FormLabel>
                        <FormDescription>
                          Include file uploads in backups
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

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={createManualBackup}
                    disabled={isCreatingBackup || refreshInterval !== null}
                  >
                    {isCreatingBackup ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Create Manual Backup
                  </Button>
                  
                  {refreshInterval && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Monitoring backup progress...
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Next Backup Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Scheduled Backup
            </CardTitle>
            <CardDescription>
              Information about the next automated backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statistics?.next_backup ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Scheduled for:</span>
                  <span className="font-medium">
                    {new Date(statistics.next_backup).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Frequency:</span>
                  <span className="font-medium capitalize">
                    {form.watch('backup_frequency')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <span className="font-medium">
                    {form.watch('backup_time')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Include Attachments:</span>
                  <span className="font-medium">
                    {form.watch('include_attachments') ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No automated backups scheduled</p>
                <p className="text-sm text-muted-foreground">Enable automated backups to see schedule</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup History
              </CardTitle>
              <CardDescription>
                Recent backup operations and their status
              </CardDescription>
            </div>
          </div>
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
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No backup history available
                  </TableCell>
                </TableRow>
              ) : (
                backupHistory.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        {backup.error_message && (
                          <p className="text-xs text-red-600">{backup.error_message}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {backup.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>
                      {backup.file_size_mb 
                        ? `${backup.file_size_mb} MB` 
                        : backup.status === 'completed' 
                          ? 'Unknown' 
                          : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{new Date(backup.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(backup.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {backup.duration || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1">
                        {backup.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadBackup(backup.id, backup.name)}
                            title="Download backup"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {backup.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={createManualBackup}
                            title="Retry backup"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBackupRecord(backup.id)}
                          title="Delete backup record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
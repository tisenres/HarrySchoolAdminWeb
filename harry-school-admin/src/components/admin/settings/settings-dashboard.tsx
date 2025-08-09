'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  Settings,
  Users,
  Shield,
  Database,
  Bell,
  Archive,
  Globe,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Info,
  Building
} from 'lucide-react'

// Import all settings components
import { UserManagement } from './user-management'
import { OrganizationSettings } from './organization-settings'
import { ArchiveManagement } from './archive-management'
import { SystemSettings } from './system-settings'
import { NotificationSettings } from './notification-settings'
import { SecuritySettings } from './security-settings'
import { BackupManagement } from './backup-management'

interface SettingsDashboardProps {
  organizationId: string
  initialTab?: string
}

interface SettingsStatus {
  organization: 'complete' | 'incomplete' | 'warning'
  users: 'complete' | 'incomplete' | 'warning'
  security: 'complete' | 'incomplete' | 'warning'
  backup: 'complete' | 'incomplete' | 'warning'
  notifications: 'complete' | 'incomplete' | 'warning'
}

export function SettingsDashboard({ organizationId, initialTab = 'overview' }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null)
  const [user, setUser] = useState<User | null>(null)
  // supabase is already imported

  const settingsSections = [
    {
      id: 'organization',
      label: 'Organization',
      description: 'Basic organization information and preferences',
      icon: Building,
      component: OrganizationSettings,
      requiredRole: ['admin', 'superadmin']
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Manage admin users and permissions',
      icon: Users,
      component: UserManagement,
      requiredRole: ['admin', 'superadmin']
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Password policies, 2FA, and access controls',
      icon: Shield,
      component: SecuritySettings,
      requiredRole: ['superadmin']
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Email, push, and SMS notification preferences',
      icon: Bell,
      component: NotificationSettings,
      requiredRole: ['admin', 'superadmin']
    },
    {
      id: 'backup',
      label: 'Backup & Recovery',
      description: 'Automated backups and data restoration',
      icon: Database,
      component: BackupManagement,
      requiredRole: ['superadmin']
    },
    {
      id: 'system',
      label: 'System Settings',
      description: 'System-wide configuration and maintenance',
      icon: Settings,
      component: SystemSettings,
      requiredRole: ['superadmin']
    },
    {
      id: 'archive',
      label: 'Archive Management',
      description: 'Manage soft-deleted records and data recovery',
      icon: Archive,
      component: ArchiveManagement,
      requiredRole: ['admin', 'superadmin']
    }
  ]

  useEffect(() => {
    fetchSettingsStatus()
    fetchUser()
  }, [organizationId])

  const fetchUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchSettingsStatus = async () => {
    try {
      const response = await fetch(`/api/settings/status?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setSettingsStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching settings status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Complete
        </Badge>
      case 'warning':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Needs Attention
        </Badge>
      case 'incomplete':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          Incomplete
        </Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getOverallStatus = () => {
    if (!settingsStatus) return 'checking'
    
    const statuses = Object.values(settingsStatus)
    if (statuses.every(status => status === 'complete')) return 'complete'
    if (statuses.some(status => status === 'warning')) return 'warning'
    if (statuses.some(status => status === 'incomplete')) return 'incomplete'
    return 'complete'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600'
      case 'warning': return 'text-red-600'
      case 'incomplete': return 'text-yellow-600'
      default: return 'text-muted-foreground'
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings Overview
          </CardTitle>
          <CardDescription>
            Current status of your system configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsSections.map((section) => {
              const status = settingsStatus?.[section.id as keyof SettingsStatus] || 'incomplete'
              const Icon = section.icon
              
              return (
                <div key={section.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{section.label}</p>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common settings tasks and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Invite New User</p>
                <p className="text-sm text-muted-foreground">Add admin users to your organization</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('backup')}
            >
              <Database className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Create Backup</p>
                <p className="text-sm text-muted-foreground">Backup your data immediately</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('security')}
            >
              <Shield className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Security Review</p>
                <p className="text-sm text-muted-foreground">Review security settings and policies</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('archive')}
            >
              <Archive className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Manage Archives</p>
                <p className="text-sm text-muted-foreground">Restore or permanently delete archived items</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              getOverallStatus() === 'complete' ? 'bg-green-500' :
              getOverallStatus() === 'warning' ? 'bg-red-500' :
              getOverallStatus() === 'incomplete' ? 'bg-yellow-500' : 'bg-gray-500'
            }`} />
            System Health
          </CardTitle>
          <CardDescription>
            Overall system configuration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>Organization Setup</span>
              </div>
              <span className={getStatusColor(settingsStatus?.organization || 'incomplete')}>
                {settingsStatus?.organization || 'Checking...'}
              </span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>User Management</span>
              </div>
              <span className={getStatusColor(settingsStatus?.users || 'incomplete')}>
                {settingsStatus?.users || 'Checking...'}
              </span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Security Configuration</span>
              </div>
              <span className={getStatusColor(settingsStatus?.security || 'incomplete')}>
                {settingsStatus?.security || 'Checking...'}
              </span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Backup System</span>
              </div>
              <span className={getStatusColor(settingsStatus?.backup || 'incomplete')}>
                {settingsStatus?.backup || 'Checking...'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSettingsContent = () => {
    if (activeTab === 'overview') {
      return renderOverview()
    }

    const section = settingsSections.find(s => s.id === activeTab)
    if (!section) return null

    const Component = section.component
    return (
      <Component 
        organizationId={organizationId} 
        userId={user?.id}
        {...(section.id === 'notifications' ? { userId: user?.id } : {})}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system preferences and manage your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            getOverallStatus() === 'complete' ? 'bg-green-500' :
            getOverallStatus() === 'warning' ? 'bg-red-500' :
            getOverallStatus() === 'incomplete' ? 'bg-yellow-500' : 'bg-gray-500'
          }`} />
          <span className="text-sm text-muted-foreground">
            System {getOverallStatus() === 'checking' ? 'Checking...' : getOverallStatus()}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {settingsSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              <section.icon className="h-4 w-4 mr-2" />
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderSettingsContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
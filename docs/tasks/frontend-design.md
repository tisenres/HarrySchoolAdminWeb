# Frontend Architecture: Student Credentials Management System
Agent: frontend-developer  
Date: 2025-09-10

## Executive Summary
This document provides comprehensive frontend architecture specifications for implementing the Harry School CRM student credentials management system. Based on security audit findings and backend architecture requirements, this design integrates seamlessly with the existing Next.js 14+ admin panel while introducing secure credential management capabilities for educational data protection.

**Key Design Principles:**
- **Security-First UI**: Privacy-focused interfaces for handling sensitive educational credentials
- **Component Reusability**: Extends existing shadcn/ui patterns and admin panel components
- **Educational Compliance**: FERPA-compliant UI patterns with parent access controls
- **Performance Optimization**: Efficient data loading and virtualization for 500+ student records
- **Responsive Design**: Desktop-first with tablet compatibility for administrative workflows

## Current System Analysis

### Existing Admin Panel Architecture
```typescript
// Current structure analyzed:
AdminPanel/
├── DashboardLayoutClient/
│   ├── Sidebar Navigation
│   ├── TopBar with search/notifications
│   └── Main Content Area
├── Student Management/
│   ├── StudentsTable (comprehensive data table)
│   ├── StudentForm (multi-tab form with validation)
│   ├── StudentsFilters (search/filter components)
│   └── Student Profile Pages
└── Settings/
    ├── SecuritySettings
    ├── OrganizationSettings
    └── UserManagement
```

### Current Component Patterns Identified
- **Table Components**: Advanced data tables with sorting, pagination, bulk actions
- **Form Components**: Multi-step forms with Zod validation and react-hook-form
- **Modal/Sheet Patterns**: Dialogs and slide-out panels for detailed operations
- **State Management**: Zustand stores with React Query for server state
- **Animation System**: Framer Motion with educational-themed animations
- **Styling**: Tailwind CSS with shadcn/ui components and Harry School theming

## Component Architecture Design

### 1. Credential Management Components Hierarchy
```
CredentialManagement/
├── CredentialsDashboard/
│   ├── CredentialsOverview/
│   │   ├── CredentialsStats
│   │   ├── CredentialsChart
│   │   └── RecentCredentialActivity
│   └── CredentialsList/
│       ├── CredentialsTable
│       ├── CredentialsFilters
│       └── CredentialsBulkActions
├── StudentCredentials/
│   ├── CredentialCard/
│   │   ├── CredentialHeader
│   │   ├── CredentialDisplay (masked)
│   │   └── CredentialActions
│   ├── CredentialGeneration/
│   │   ├── GenerateCredentialsForm
│   │   ├── UsernamePreview
│   │   └── ParentNotificationSettings
│   └── CredentialHistory/
│       ├── CredentialTimeline
│       ├── AuditLog
│       └── ParentNotifications
└── BulkOperations/
    ├── BulkCredentialGeneration
    ├── BulkPasswordReset
    └── BulkParentNotification
```

### 2. Core Component Specifications

#### CredentialsTable Component
```typescript
interface CredentialsTableProps {
  students: StudentWithCredentials[]
  onGenerateCredentials: (studentIds: string[]) => Promise<void>
  onResetPassword: (studentId: string) => Promise<void>
  onViewCredentials: (studentId: string) => void
  onBulkGenerate: (studentIds: string[]) => Promise<void>
  onBulkReset: (studentIds: string[]) => Promise<void>
  onExportCredentials: (studentIds: string[]) => Promise<void>
  selectedStudents: string[]
  onSelectionChange: (studentIds: string[]) => void
  loading?: boolean
  credentialStats: CredentialStats
}

interface StudentWithCredentials extends Student {
  credentials?: {
    username?: string
    hasCredentials: boolean
    credentialType: 'initial' | 'reset' | 'updated'
    generatedAt?: string
    lastLogin?: string
    parentNotified: boolean
    accountLocked: boolean
  }
}

interface CredentialStats {
  totalStudents: number
  studentsWithCredentials: number
  credentialsGenerated: number
  passwordResets: number
  parentNotificationsSent: number
  activeLogins: number
}
```

#### CredentialCard Component
```typescript
interface CredentialCardProps {
  student: StudentWithCredentials
  onGenerateCredentials: () => Promise<void>
  onResetPassword: () => Promise<void>
  onToggleVisibility: () => void
  onCopyCredentials: () => void
  onNotifyParent: () => Promise<void>
  onViewAuditLog: () => void
  showCredentials: boolean
  userPermissions: string[]
  generating?: boolean
  resetting?: boolean
}

// Security-focused credential display
const CredentialDisplay = ({ 
  username, 
  showCredentials, 
  onToggleVisibility,
  onCopyCredentials,
  userPermissions 
}: CredentialDisplayProps) => {
  const canViewCredentials = userPermissions.includes('view_student_credentials')
  
  return (
    <div className="space-y-3">
      {/* Username Display */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-md">
        <div className="flex items-center space-x-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <Label className="text-xs text-muted-foreground">Username</Label>
            <p className="font-mono text-sm font-medium">{username}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopyCredentials()}
          className="h-8"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>

      {/* Password Display (Security-Masked) */}
      {canViewCredentials && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <div className="flex items-center space-x-3">
            <Key className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <p className="font-mono text-sm">
                {showCredentials ? '••••••••••' : '••••••••••'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="h-8"
            >
              {showCredentials ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

#### GenerateCredentialsForm Component
```typescript
interface GenerateCredentialsFormProps {
  student: Student
  onSubmit: (data: GenerateCredentialsRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface GenerateCredentialsRequest {
  customUsername?: string
  temporaryPassword?: string
  notifyParent: boolean
  parentEmail?: string
  includeInstructions: boolean
  expiresIn: number // days
  requirePasswordChange: boolean
}

const GenerateCredentialsForm = ({ 
  student, 
  onSubmit, 
  loading, 
  open, 
  onOpenChange 
}: GenerateCredentialsFormProps) => {
  const form = useForm<GenerateCredentialsRequest>({
    resolver: zodResolver(generateCredentialsSchema),
    defaultValues: {
      notifyParent: true,
      includeInstructions: true,
      expiresIn: 90,
      requirePasswordChange: true
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5" />
            <span>Generate Student Credentials</span>
          </DialogTitle>
          <DialogDescription>
            Create login credentials for {student.full_name}. 
            This will enable student portal access.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="auto" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">Auto Generate</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Automatic Generation</AlertTitle>
                  <AlertDescription>
                    Username and password will be automatically generated using secure patterns.
                  </AlertDescription>
                </Alert>

                {/* Username Preview */}
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Generated Username Preview</Label>
                  <p className="font-mono text-sm text-muted-foreground mt-1">
                    {generatePreviewUsername(student.first_name, student.last_name)}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <FormField
                  control={form.control}
                  name="customUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter custom username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Must be 3-20 characters, letters and numbers only
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temporaryPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Auto-generated if empty" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty for secure auto-generation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Parent Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parent Notification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notifyParent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Notify Parent/Guardian</FormLabel>
                        <FormDescription>
                          Send login credentials to parent/guardian via email or SMS
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('notifyParent') && (
                  <>
                    <FormField
                      control={form.control}
                      name="parentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder={student.parent_email || "Enter parent email"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeInstructions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Include Instructions</FormLabel>
                            <FormDescription>
                              Add login instructions and portal tour information
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="expiresIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential Expiration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expiration period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                          <SelectItem value="0">Never expires</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How long before student must change password
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirePasswordChange"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Force Password Change</FormLabel>
                        <FormDescription>
                          Require student to change password on first login
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Generating..."
              >
                <Key className="h-4 w-4 mr-2" />
                Generate Credentials
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

### 3. Integration with Existing Student Management

#### Enhanced StudentsTable Integration
```typescript
// Add credential-related columns to existing students table
const getCredentialColumns = (t: any): ColumnConfig[] => [
  ...getDefaultColumns(t),
  { 
    key: 'credentials', 
    label: getText('credentials', 'Credentials'), 
    sortable: false, 
    visible: true 
  },
  { 
    key: 'last_login', 
    label: getText('lastLogin', 'Last Login'), 
    sortable: true, 
    visible: true 
  },
  { 
    key: 'credential_status', 
    label: getText('credentialStatus', 'Status'), 
    sortable: true, 
    visible: true 
  }
]

// Enhanced table cell rendering
{column.key === 'credentials' && (
  <div className="flex items-center space-x-2">
    {student.credentials?.hasCredentials ? (
      <div className="flex items-center space-x-2">
        <Badge variant="success" className="bg-green-100 text-green-800">
          <Key className="h-3 w-3 mr-1" />
          Active
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewCredentials(student.id)
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Missing
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onGenerateCredentials([student.id])
          }}
        >
          <Key className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
)}

{column.key === 'last_login' && (
  <div className="text-sm">
    {student.credentials?.lastLogin ? (
      <div className="flex items-center space-x-1">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span>{formatDate(student.credentials.lastLogin)}</span>
      </div>
    ) : (
      <span className="text-muted-foreground">Never</span>
    )}
  </div>
)}

{column.key === 'credential_status' && (
  <div className="flex items-center space-x-1">
    {student.credentials?.accountLocked ? (
      <Badge variant="destructive">
        <Lock className="h-3 w-3 mr-1" />
        Locked
      </Badge>
    ) : student.credentials?.hasCredentials ? (
      student.credentials.parentNotified ? (
        <Badge variant="success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Notified
        </Badge>
      ) : (
        <Badge variant="warning">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    ) : (
      <Badge variant="secondary">
        <Minus className="h-3 w-3 mr-1" />
        N/A
      </Badge>
    )}
  </div>
)}
```

#### Bulk Operations Enhancement
```typescript
// Add credential-specific bulk operations to existing table
const credentialBulkActions = [
  {
    key: 'generate_credentials',
    label: 'Generate Credentials',
    icon: Key,
    action: onBulkGenerateCredentials,
    loading: bulkGenerateLoading,
    variant: 'default' as const
  },
  {
    key: 'reset_passwords',
    label: 'Reset Passwords',
    icon: RotateCcw,
    action: onBulkResetPasswords,
    loading: bulkResetLoading,
    variant: 'outline' as const
  },
  {
    key: 'notify_parents',
    label: 'Notify Parents',
    icon: Send,
    action: onBulkNotifyParents,
    loading: bulkNotifyLoading,
    variant: 'outline' as const
  },
  {
    key: 'export_credentials',
    label: 'Export Credentials',
    icon: Download,
    action: onBulkExportCredentials,
    loading: bulkExportLoading,
    variant: 'outline' as const
  }
]

// Render bulk actions in table header
{selectedStudents.length > 0 && (
  <div className="flex items-center space-x-2">
    <span className="text-sm text-muted-foreground">
      {selectedStudents.length} selected
    </span>
    
    {credentialBulkActions.map((action) => (
      <LoadingButton
        key={action.key}
        variant={action.variant}
        size="sm"
        loading={action.loading}
        loadingText={`${action.label}...`}
        onClick={() => action.action(selectedStudents)}
      >
        <action.icon className="h-4 w-4 mr-2" />
        {action.label}
      </LoadingButton>
    ))}
  </div>
)}
```

## State Management Architecture

### 1. Zustand Stores
```typescript
// /src/stores/credentials-store.ts
interface CredentialsStore {
  // State
  students: StudentWithCredentials[]
  credentialStats: CredentialStats
  selectedStudents: string[]
  bulkOperations: {
    generating: boolean
    resetting: boolean
    notifying: boolean
    exporting: boolean
  }
  filters: {
    credentialStatus: 'all' | 'active' | 'missing' | 'locked'
    lastLoginDays: number | null
    parentNotified: boolean | null
  }
  
  // Actions
  setStudents: (students: StudentWithCredentials[]) => void
  updateStudent: (studentId: string, updates: Partial<StudentWithCredentials>) => void
  setSelectedStudents: (studentIds: string[]) => void
  setFilters: (filters: Partial<typeof this.filters>) => void
  
  // Credential Operations
  generateCredentials: (studentIds: string[], options: GenerateCredentialsRequest) => Promise<void>
  resetPasswords: (studentIds: string[]) => Promise<void>
  notifyParents: (studentIds: string[]) => Promise<void>
  exportCredentials: (studentIds: string[]) => Promise<void>
  
  // Bulk Operations
  setBulkOperation: (operation: keyof typeof this.bulkOperations, loading: boolean) => void
  
  // Computed
  getFilteredStudents: () => StudentWithCredentials[]
  getStudentById: (id: string) => StudentWithCredentials | undefined
  getCredentialStats: () => CredentialStats
}

export const useCredentialsStore = create<CredentialsStore>((set, get) => ({
  students: [],
  credentialStats: {
    totalStudents: 0,
    studentsWithCredentials: 0,
    credentialsGenerated: 0,
    passwordResets: 0,
    parentNotificationsSent: 0,
    activeLogins: 0
  },
  selectedStudents: [],
  bulkOperations: {
    generating: false,
    resetting: false,
    notifying: false,
    exporting: false
  },
  filters: {
    credentialStatus: 'all',
    lastLoginDays: null,
    parentNotified: null
  },
  
  setStudents: (students) => set({ students }),
  
  updateStudent: (studentId, updates) =>
    set((state) => ({
      students: state.students.map((student) =>
        student.id === studentId ? { ...student, ...updates } : student
      )
    })),
  
  setSelectedStudents: (studentIds) => set({ selectedStudents: studentIds }),
  
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  
  generateCredentials: async (studentIds, options) => {
    set((state) => ({
      bulkOperations: { ...state.bulkOperations, generating: true }
    }))
    
    try {
      const response = await fetch('/api/students/credentials/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, options })
      })
      
      if (!response.ok) throw new Error('Failed to generate credentials')
      
      const { data } = await response.json()
      
      // Update students with new credentials
      set((state) => ({
        students: state.students.map((student) => {
          const credentialData = data.find((c: any) => c.studentId === student.id)
          return credentialData
            ? {
                ...student,
                credentials: {
                  ...student.credentials,
                  hasCredentials: true,
                  username: credentialData.username,
                  credentialType: 'initial',
                  generatedAt: new Date().toISOString(),
                  parentNotified: options.notifyParent
                }
              }
            : student
        })
      }))
      
      toast.success(`Generated credentials for ${studentIds.length} students`)
      
    } catch (error) {
      toast.error('Failed to generate credentials')
      throw error
    } finally {
      set((state) => ({
        bulkOperations: { ...state.bulkOperations, generating: false }
      }))
    }
  },
  
  getFilteredStudents: () => {
    const { students, filters } = get()
    
    return students.filter((student) => {
      if (filters.credentialStatus !== 'all') {
        switch (filters.credentialStatus) {
          case 'active':
            if (!student.credentials?.hasCredentials) return false
            break
          case 'missing':
            if (student.credentials?.hasCredentials) return false
            break
          case 'locked':
            if (!student.credentials?.accountLocked) return false
            break
        }
      }
      
      if (filters.lastLoginDays !== null) {
        const lastLogin = student.credentials?.lastLogin
        if (!lastLogin) return false
        
        const daysSinceLogin = Math.floor(
          (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLogin > filters.lastLoginDays) return false
      }
      
      if (filters.parentNotified !== null) {
        if (student.credentials?.parentNotified !== filters.parentNotified) {
          return false
        }
      }
      
      return true
    })
  },
  
  getCredentialStats: () => {
    const { students } = get()
    const stats: CredentialStats = {
      totalStudents: students.length,
      studentsWithCredentials: students.filter(s => s.credentials?.hasCredentials).length,
      credentialsGenerated: students.filter(s => s.credentials?.generatedAt).length,
      passwordResets: students.filter(s => s.credentials?.credentialType === 'reset').length,
      parentNotificationsSent: students.filter(s => s.credentials?.parentNotified).length,
      activeLogins: students.filter(s => {
        const lastLogin = s.credentials?.lastLogin
        if (!lastLogin) return false
        const daysSince = Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
        return daysSince <= 7
      }).length
    }
    return stats
  }
}))
```

### 2. React Query Integration
```typescript
// /src/hooks/use-student-credentials.ts
export function useStudentCredentials(organizationId: string) {
  return useQuery({
    queryKey: ['student-credentials', organizationId],
    queryFn: async (): Promise<StudentWithCredentials[]> => {
      const response = await fetch(`/api/students?include_credentials=true`)
      if (!response.ok) throw new Error('Failed to fetch students with credentials')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useGenerateCredentials() {
  const queryClient = useQueryClient()
  const { updateStudent } = useCredentialsStore()
  
  return useMutation({
    mutationFn: async ({ 
      studentId, 
      options 
    }: { 
      studentId: string
      options: GenerateCredentialsRequest 
    }) => {
      const response = await fetch(`/api/students/${studentId}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })
      
      if (!response.ok) throw new Error('Failed to generate credentials')
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Update local state
      updateStudent(variables.studentId, {
        credentials: {
          hasCredentials: true,
          username: data.username,
          credentialType: 'initial',
          generatedAt: new Date().toISOString(),
          parentNotified: variables.options.notifyParent,
          accountLocked: false
        }
      })
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['student-credentials'] })
      
      toast.success('Student credentials generated successfully')
    },
    onError: (error) => {
      toast.error('Failed to generate credentials')
    }
  })
}

export function useCredentialAuditLog(studentId: string) {
  return useQuery({
    queryKey: ['credential-audit', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/credentials/audit`)
      if (!response.ok) throw new Error('Failed to fetch audit log')
      return response.json()
    },
    enabled: !!studentId
  })
}
```

## Navigation and Routing Integration

### 1. Navigation Menu Updates
```typescript
// Add to existing sidebar navigation
const credentialManagementNavItems = [
  {
    title: 'Students',
    href: '/dashboard/students',
    icon: Users,
    children: [
      {
        title: 'All Students',
        href: '/dashboard/students',
        icon: UserCheck
      },
      {
        title: 'Credentials',
        href: '/dashboard/students/credentials',
        icon: Key,
        badge: 'New'
      },
      {
        title: 'Bulk Operations',
        href: '/dashboard/students/bulk',
        icon: Settings2
      }
    ]
  }
]

// Navigation component updates
<NavigationMenuItem>
  <NavigationMenuTrigger className="flex items-center space-x-2">
    <Users className="h-4 w-4" />
    <span>Students</span>
  </NavigationMenuTrigger>
  <NavigationMenuContent>
    <div className="w-48 p-2">
      <NavigationMenuLink href="/dashboard/students">
        <UserCheck className="h-4 w-4 mr-2" />
        All Students
      </NavigationMenuLink>
      <NavigationMenuLink href="/dashboard/students/credentials">
        <Key className="h-4 w-4 mr-2" />
        Credentials
        <Badge variant="secondary" className="ml-auto">New</Badge>
      </NavigationMenuLink>
      <NavigationMenuLink href="/dashboard/students/bulk">
        <Settings2 className="h-4 w-4 mr-2" />
        Bulk Operations
      </NavigationMenuLink>
    </div>
  </NavigationMenuContent>
</NavigationMenuItem>
```

### 2. Route Structure
```typescript
// File structure for new routes
src/app/[locale]/(dashboard)/
├── students/
│   ├── credentials/
│   │   ├── page.tsx (CredentialsDashboard)
│   │   ├── [studentId]/
│   │   │   └── page.tsx (StudentCredentialDetail)
│   │   └── bulk/
│   │       └── page.tsx (BulkCredentialOperations)
│   ├── [id]/
│   │   ├── page.tsx (enhanced with credential tab)
│   │   └── credentials/
│   │       └── page.tsx (StudentCredentialManagement)
│   └── bulk/
│       └── page.tsx (BulkStudentOperations)
```

### 3. Page Components
```typescript
// /src/app/[locale]/(dashboard)/students/credentials/page.tsx
'use client'

export default function CredentialsPage() {
  const { data: students, isLoading } = useStudentCredentials()
  const credentialsStore = useCredentialsStore()
  
  useEffect(() => {
    if (students) {
      credentialsStore.setStudents(students)
    }
  }, [students])
  
  if (isLoading) {
    return <CredentialsDashboardSkeleton />
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Credentials</h1>
          <p className="text-muted-foreground">
            Manage student login credentials and parent notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Bulk Generate
          </Button>
        </div>
      </div>
      
      <CredentialsOverview stats={credentialsStore.getCredentialStats()} />
      
      <Card>
        <CardHeader>
          <CardTitle>Student Credentials</CardTitle>
          <CardDescription>
            View and manage student login credentials, password resets, and parent notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CredentialsTable
            students={credentialsStore.getFilteredStudents()}
            selectedStudents={credentialsStore.selectedStudents}
            onSelectionChange={credentialsStore.setSelectedStudents}
            onGenerateCredentials={credentialsStore.generateCredentials}
            onResetPassword={credentialsStore.resetPasswords}
            bulkOperations={credentialsStore.bulkOperations}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Responsive Design Specifications

### 1. Breakpoint Strategy
```css
/* Tailwind CSS breakpoints for credential management */
.credential-table {
  /* Mobile First Approach */
  @apply w-full overflow-x-auto;
}

/* Tablet (768px+) */
@screen md {
  .credential-card-grid {
    @apply grid-cols-2;
  }
  
  .credential-form-layout {
    @apply flex-row space-x-6 space-y-0;
  }
}

/* Desktop (1024px+) */
@screen lg {
  .credential-card-grid {
    @apply grid-cols-3;
  }
  
  .credential-table-actions {
    @apply flex-row;
  }
}

/* Large Desktop (1280px+) */
@screen xl {
  .credential-dashboard {
    @apply grid-cols-4;
  }
}
```

### 2. Mobile-Optimized Components
```typescript
// Mobile-friendly credential card
const MobileCredentialCard = ({ student, ...props }: CredentialCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={student.profile_image_url} />
            <AvatarFallback>
              {student.first_name[0]}{student.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{student.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{student.student_id}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => props.onViewCredentials()}>
                <Eye className="h-4 w-4 mr-2" />
                View Credentials
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onResetPassword()}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onNotifyParent()}>
                <Send className="h-4 w-4 mr-2" />
                Notify Parent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Credential Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Credentials</span>
          {student.credentials?.hasCredentials ? (
            <Badge variant="success" className="bg-green-100 text-green-800">
              <Key className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Missing
            </Badge>
          )}
        </div>
        
        {/* Last Login */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Login</span>
          <span className="text-sm">
            {student.credentials?.lastLogin ? (
              formatDate(student.credentials.lastLogin)
            ) : (
              'Never'
            )}
          </span>
        </div>
        
        {/* Parent Notification Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Parent Notified</span>
          {student.credentials?.parentNotified ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          {!student.credentials?.hasCredentials && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => props.onGenerateCredentials()}
            >
              <Key className="h-3 w-3 mr-1" />
              Generate
            </Button>
          )}
          {student.credentials?.hasCredentials && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => props.onResetPassword()}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. Responsive Table Implementation
```typescript
// Enhanced responsive table with credential columns
const ResponsiveCredentialsTable = ({ students, ...props }: CredentialsTableProps) => {
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Students ({students.length})</h3>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {students.map((student) => (
            <MobileCredentialCard
              key={student.id}
              student={student}
              {...props}
            />
          ))}
        </div>
      </div>
    )
  }
  
  // Desktop table implementation
  return <CredentialsTable students={students} {...props} />
}
```

## Security UI Considerations

### 1. Educational Data Privacy Controls
```typescript
// FERPA-compliant access control UI
const EducationalDataAccessWrapper = ({ 
  children, 
  requiredPermission,
  studentId,
  dataType = 'educational_record'
}: {
  children: React.ReactNode
  requiredPermission: string
  studentId: string
  dataType?: 'directory_info' | 'educational_record' | 'health_record' | 'financial_record'
}) => {
  const { user, permissions } = useAuth()
  const hasPermission = permissions.includes(requiredPermission)
  const isEducationalData = ['educational_record', 'health_record', 'financial_record'].includes(dataType)
  
  // Log access attempt for audit trail
  useEffect(() => {
    if (hasPermission && isEducationalData) {
      logEducationalDataAccess({
        userId: user.id,
        studentId,
        dataType,
        action: 'view_attempt',
        timestamp: new Date().toISOString()
      })
    }
  }, [hasPermission, isEducationalData, studentId, dataType, user.id])
  
  if (!hasPermission) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center space-x-3 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Access Restricted</p>
            <p className="text-sm text-red-600">
              You don't have permission to view this educational data.
              Contact your administrator for access.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="relative">
      {isEducationalData && (
        <div className="absolute top-0 right-0 z-10">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="h-3 w-3 mr-1" />
            FERPA Protected
          </Badge>
        </div>
      )}
      {children}
    </div>
  )
}
```

### 2. Secure Credential Display Patterns
```typescript
// Secure credential viewing with audit logging
const SecureCredentialViewer = ({ 
  student, 
  onViewCredentials,
  onCopyCredentials 
}: {
  student: StudentWithCredentials
  onViewCredentials: () => void
  onCopyCredentials: () => void
}) => {
  const [showCredentials, setShowCredentials] = useState(false)
  const [auditLogged, setAuditLogged] = useState(false)
  const { user, permissions } = useAuth()
  
  const handleViewCredentials = async () => {
    if (!permissions.includes('view_student_credentials')) {
      toast.error('You do not have permission to view student credentials')
      return
    }
    
    // Log credential access for audit
    if (!auditLogged) {
      await logCredentialAccess({
        userId: user.id,
        studentId: student.id,
        action: 'view_credentials',
        timestamp: new Date().toISOString(),
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent
      })
      setAuditLogged(true)
    }
    
    setShowCredentials(true)
    onViewCredentials()
    
    // Auto-hide after 30 seconds for security
    setTimeout(() => {
      setShowCredentials(false)
    }, 30000)
  }
  
  const handleCopyCredentials = async () => {
    if (!showCredentials) {
      toast.error('Please view credentials first')
      return
    }
    
    // Log credential copy action
    await logCredentialAccess({
      userId: user.id,
      studentId: student.id,
      action: 'copy_credentials',
      timestamp: new Date().toISOString()
    })
    
    onCopyCredentials()
    toast.success('Credentials copied to clipboard', {
      description: 'Please ensure secure handling of this sensitive information'
    })
  }
  
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <Lock className="h-5 w-5" />
          <span>Secure Credential Access</span>
        </CardTitle>
        <CardDescription className="text-amber-700">
          Student credentials are protected and access is audited for security compliance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Security Notice</AlertTitle>
          <AlertDescription>
            This information is confidential and protected under educational privacy laws. 
            Access is logged and monitored.
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleViewCredentials}
            disabled={!permissions.includes('view_student_credentials')}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showCredentials ? 'Hide Credentials' : 'View Credentials'}
          </Button>
          
          {showCredentials && (
            <Button
              variant="outline"
              onClick={handleCopyCredentials}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          )}
        </div>
        
        {showCredentials && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-4 bg-white rounded-lg border"
          >
            <CredentialDisplay 
              student={student}
              showCredentials={showCredentials}
              onCopyCredentials={handleCopyCredentials}
            />
            
            <div className="text-xs text-muted-foreground">
              Credentials will auto-hide in 30 seconds for security
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 3. Audit Trail UI Components
```typescript
// Credential audit log viewer
const CredentialAuditLog = ({ studentId }: { studentId: string }) => {
  const { data: auditLog, isLoading } = useCredentialAuditLog(studentId)
  
  if (isLoading) return <SkeletonAuditLog />
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Credential Audit Trail</span>
        </CardTitle>
        <CardDescription>
          Complete history of credential-related activities for compliance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditLog?.map((entry: AuditLogEntry) => (
            <div 
              key={entry.id}
              className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="mt-0.5">
                {getAuditIcon(entry.action)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {getAuditActionText(entry.action)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {entry.userType}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {entry.metadata?.userEmail} • {formatDate(entry.created_at)}
                </div>
                {entry.metadata?.ipAddress && (
                  <div className="text-xs text-muted-foreground">
                    IP: {entry.metadata.ipAddress}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(entry.created_at)}
              </div>
            </div>
          ))}
        </div>
        
        {(!auditLog || auditLog.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No audit entries found for this student
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## Performance Optimizations

### 1. Virtualization for Large Data Sets
```typescript
// Virtual table for handling 500+ student records
import { FixedSizeList as List } from 'react-window'

const VirtualizedCredentialsTable = ({ 
  students,
  height = 600,
  itemHeight = 60,
  ...props 
}: VirtualizedCredentialsTableProps) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const student = students[index]
    
    return (
      <div style={style}>
        <CredentialRow
          student={student}
          isSelected={props.selectedStudents.includes(student.id)}
          onSelect={(selected) => 
            props.onSelectionChange(
              selected 
                ? [...props.selectedStudents, student.id]
                : props.selectedStudents.filter(id => id !== student.id)
            )
          }
          {...props}
        />
      </div>
    )
  }
  
  return (
    <div className="border rounded-lg">
      <div className="h-12 border-b flex items-center px-4 bg-muted/30">
        <CredentialsTableHeader {...props} />
      </div>
      
      <List
        height={height}
        itemCount={students.length}
        itemSize={itemHeight}
        className="scrollbar-thin"
      >
        {Row}
      </List>
    </div>
  )
}

// Memoized credential row component
const CredentialRow = React.memo(({
  student,
  isSelected,
  onSelect,
  ...props
}: CredentialRowProps) => {
  return (
    <div className={`
      flex items-center px-4 py-3 border-b hover:bg-muted/50 
      ${isSelected ? 'bg-muted/30' : ''}
    `}>
      <Checkbox 
        checked={isSelected}
        onCheckedChange={onSelect}
      />
      
      <div className="flex-1 flex items-center space-x-4 ml-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={student.profile_image_url} />
          <AvatarFallback>
            {student.first_name[0]}{student.last_name[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{student.full_name}</p>
          <p className="text-sm text-muted-foreground">{student.student_id}</p>
        </div>
        
        <CredentialStatusBadge credentials={student.credentials} />
        
        <CredentialActions student={student} {...props} />
      </div>
    </div>
  )
})
```

### 2. Optimized Data Loading
```typescript
// Paginated and filtered data loading
export function usePaginatedCredentials({
  page = 1,
  pageSize = 50,
  filters = {},
  sortBy = 'full_name',
  sortOrder = 'asc'
}: UsePaginatedCredentialsParams) {
  return useInfiniteQuery({
    queryKey: ['credentials', { page, pageSize, filters, sortBy, sortOrder }],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        include_credentials: 'true',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== null && value !== undefined) {
            acc[key] = value.toString()
          }
          return acc
        }, {} as Record<string, string>)
      })
      
      const response = await fetch(`/api/students?${params}`)
      if (!response.ok) throw new Error('Failed to fetch students')
      
      return response.json()
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) {
        return pages.length + 1
      }
      return undefined
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Debounced search for credentials
export function useCredentialsSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  
  const searchResults = useQuery({
    queryKey: ['credentials-search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm) return []
      
      const response = await fetch(
        `/api/students/search?q=${encodeURIComponent(debouncedSearchTerm)}&include_credentials=true`
      )
      if (!response.ok) throw new Error('Search failed')
      
      return response.json()
    },
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  })
  
  return {
    searchTerm,
    setSearchTerm,
    searchResults: searchResults.data || [],
    isSearching: searchResults.isLoading,
    searchError: searchResults.error
  }
}
```

### 3. Component Lazy Loading
```typescript
// Lazy load credential management components
const LazyCredentialGeneration = lazy(() => 
  import('./components/credential-generation').then(mod => ({
    default: mod.CredentialGeneration
  }))
)

const LazyCredentialAuditLog = lazy(() =>
  import('./components/credential-audit-log').then(mod => ({
    default: mod.CredentialAuditLog
  }))
)

const LazyBulkCredentialOperations = lazy(() =>
  import('./components/bulk-credential-operations').then(mod => ({
    default: mod.BulkCredentialOperations
  }))
)

// Use with Suspense for better UX
const CredentialManagementPage = () => {
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="generation">Generation</TabsTrigger>
        <TabsTrigger value="audit">Audit Log</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <CredentialsOverview />
      </TabsContent>
      
      <TabsContent value="generation">
        <Suspense fallback={<CredentialGenerationSkeleton />}>
          <LazyCredentialGeneration />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="audit">
        <Suspense fallback={<AuditLogSkeleton />}>
          <LazyCredentialAuditLog />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="bulk">
        <Suspense fallback={<BulkOperationsSkeleton />}>
          <LazyBulkCredentialOperations />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}
```

## Accessibility Compliance

### 1. WCAG 2.1 AA Standards
```typescript
// Accessible credential form with proper ARIA labels
const AccessibleCredentialForm = () => {
  const [announcements, setAnnouncements] = useState<string[]>([])
  
  const announceToScreenReader = (message: string) => {
    setAnnouncements(prev => [...prev, message])
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 1000)
  }
  
  return (
    <>
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>
      
      <form className="space-y-6" role="form" aria-labelledby="credential-form-title">
        <h2 id="credential-form-title" className="text-2xl font-bold">
          Generate Student Credentials
        </h2>
        
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Credential Options</legend>
          
          <div className="space-y-2">
            <Label 
              htmlFor="username-input" 
              className="flex items-center space-x-2"
            >
              <span>Username</span>
              <Badge variant="secondary" aria-label="Required field">Required</Badge>
            </Label>
            <Input
              id="username-input"
              type="text"
              required
              aria-describedby="username-help"
              aria-invalid={!!errors.username}
            />
            <p id="username-help" className="text-sm text-muted-foreground">
              Username will be automatically generated based on student name
            </p>
            {errors.username && (
              <p 
                role="alert" 
                className="text-sm text-destructive"
                aria-live="assertive"
              >
                {errors.username.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notify-parent">
              <span className="flex items-center space-x-2">
                <span>Notify Parent/Guardian</span>
                <Badge variant="outline" aria-label="Educational requirement">FERPA</Badge>
              </span>
            </Label>
            <Switch
              id="notify-parent"
              checked={notifyParent}
              onCheckedChange={(checked) => {
                setNotifyParent(checked)
                announceToScreenReader(
                  `Parent notification ${checked ? 'enabled' : 'disabled'}`
                )
              }}
              aria-describedby="notify-parent-help"
            />
            <p id="notify-parent-help" className="text-sm text-muted-foreground">
              Send credentials to parent/guardian email for educational compliance
            </p>
          </div>
        </fieldset>
        
        <div className="flex items-center space-x-4" role="group">
          <Button
            type="submit"
            disabled={loading}
            aria-describedby={loading ? "loading-message" : undefined}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Generating Credentials...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" aria-hidden="true" />
                Generate Credentials
              </>
            )}
          </Button>
          
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>
        
        {loading && (
          <p id="loading-message" className="sr-only" aria-live="assertive">
            Generating student credentials, please wait
          </p>
        )}
      </form>
    </>
  )
}
```

### 2. Keyboard Navigation Support
```typescript
// Enhanced keyboard navigation for credential tables
const KeyboardNavigableCredentialsTable = ({ students, ...props }: CredentialsTableProps) => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => Math.max(0, prev - 1))
          break
          
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => Math.min(students.length - 1, prev + 1))
          break
          
        case ' ': // Space to select/deselect
          event.preventDefault()
          setSelectedRows(prev => {
            const newSet = new Set(prev)
            if (newSet.has(focusedIndex)) {
              newSet.delete(focusedIndex)
            } else {
              newSet.add(focusedIndex)
            }
            return newSet
          })
          break
          
        case 'Enter': // Enter to open details
          event.preventDefault()
          props.onViewCredentials?.(students[focusedIndex].id)
          break
          
        case 'a': // Ctrl+A to select all
          if (event.ctrlKey) {
            event.preventDefault()
            setSelectedRows(new Set(students.map((_, index) => index)))
          }
          break
          
        case 'Escape': // Clear selections
          event.preventDefault()
          setSelectedRows(new Set())
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [students, focusedIndex, props])
  
  return (
    <div
      role="grid"
      aria-label="Student credentials table"
      className="border rounded-lg focus-within:ring-2 focus-within:ring-primary"
      tabIndex={-1}
    >
      {/* Column Headers */}
      <div role="row" className="border-b bg-muted/30">
        <div role="columnheader" className="p-3 font-medium">
          Student
        </div>
        <div role="columnheader" className="p-3 font-medium">
          Credentials
        </div>
        <div role="columnheader" className="p-3 font-medium">
          Last Login
        </div>
        <div role="columnheader" className="p-3 font-medium">
          Actions
        </div>
      </div>
      
      {/* Data Rows */}
      {students.map((student, index) => (
        <div
          key={student.id}
          role="row"
          className={`
            border-b hover:bg-muted/50 focus:bg-muted/50 focus:ring-2 focus:ring-primary
            ${index === focusedIndex ? 'bg-muted/30' : ''}
            ${selectedRows.has(index) ? 'bg-primary/10' : ''}
          `}
          tabIndex={0}
          aria-selected={selectedRows.has(index)}
          aria-rowindex={index + 2} // +2 for header row
          onFocus={() => setFocusedIndex(index)}
        >
          <div role="gridcell" className="p-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedRows.has(index)}
                onCheckedChange={(checked) => {
                  setSelectedRows(prev => {
                    const newSet = new Set(prev)
                    if (checked) {
                      newSet.add(index)
                    } else {
                      newSet.delete(index)
                    }
                    return newSet
                  })
                }}
                aria-label={`Select ${student.full_name}`}
              />
              <Avatar className="h-8 w-8">
                <AvatarImage src={student.profile_image_url} />
                <AvatarFallback>
                  {student.first_name[0]}{student.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">{student.student_id}</p>
              </div>
            </div>
          </div>
          
          <div role="gridcell" className="p-3">
            <CredentialStatusBadge credentials={student.credentials} />
          </div>
          
          <div role="gridcell" className="p-3 text-sm text-muted-foreground">
            {student.credentials?.lastLogin ? (
              formatDate(student.credentials.lastLogin)
            ) : (
              'Never'
            )}
          </div>
          
          <div role="gridcell" className="p-3">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => props.onViewCredentials?.(student.id)}
                aria-label={`View credentials for ${student.full_name}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => props.onResetPassword?.(student.id)}
                aria-label={`Reset password for ${student.full_name}`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Testing Strategy

### 1. Component Testing with React Testing Library
```typescript
// /src/components/__tests__/credential-generation.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CredentialGeneration } from '../credential-generation'

const mockStudent = {
  id: '1',
  full_name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  student_id: 'STU001',
  parent_email: 'parent@example.com'
}

describe('CredentialGeneration', () => {
  it('should render form with proper accessibility labels', () => {
    render(
      <CredentialGeneration
        student={mockStudent}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        open={true}
        onOpenChange={jest.fn()}
      />
    )
    
    expect(screen.getByRole('form', { name: /generate student credentials/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notify parent/i)).toBeInTheDocument()
  })
  
  it('should handle form submission correctly', async () => {
    const mockOnSubmit = jest.fn()
    const user = userEvent.setup()
    
    render(
      <CredentialGeneration
        student={mockStudent}
        onSubmit={mockOnSubmit}
        onCancel={jest.fn()}
        open={true}
        onOpenChange={jest.fn()}
      />
    )
    
    // Fill out form
    await user.click(screen.getByLabelText(/notify parent/i))
    await user.click(screen.getByRole('button', { name: /generate credentials/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        notifyParent: true,
        includeInstructions: true,
        expiresIn: 90,
        requirePasswordChange: true
      })
    })
  })
  
  it('should show loading state correctly', () => {
    render(
      <CredentialGeneration
        student={mockStudent}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        open={true}
        onOpenChange={jest.fn()}
        loading={true}
      />
    )
    
    const submitButton = screen.getByRole('button', { name: /generating/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByLabelText(/generating student credentials, please wait/i)).toBeInTheDocument()
  })
  
  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <CredentialGeneration
        student={mockStudent}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        open={true}
        onOpenChange={jest.fn()}
      />
    )
    
    // Test Tab navigation
    await user.tab()
    expect(screen.getByLabelText(/username/i)).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText(/notify parent/i)).toHaveFocus()
    
    // Test Space to toggle switch
    await user.keyboard(' ')
    expect(screen.getByLabelText(/notify parent/i)).toBeChecked()
  })
})
```

### 2. Integration Testing
```typescript
// /src/components/__tests__/credentials-table.integration.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CredentialsTable } from '../credentials-table'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('CredentialsTable Integration', () => {
  it('should handle bulk credential generation', async () => {
    const mockStudents = [
      { id: '1', full_name: 'John Doe', credentials: { hasCredentials: false } },
      { id: '2', full_name: 'Jane Smith', credentials: { hasCredentials: false } }
    ]
    
    const mockOnBulkGenerate = jest.fn().mockResolvedValue({
      success: true,
      data: [
        { studentId: '1', username: 'john24abc123' },
        { studentId: '2', username: 'jane24def456' }
      ]
    })
    
    renderWithProviders(
      <CredentialsTable
        students={mockStudents}
        selectedStudents={['1', '2']}
        onBulkGenerateCredentials={mockOnBulkGenerate}
        onSelectionChange={jest.fn()}
        onGenerateCredentials={jest.fn()}
        onResetPassword={jest.fn()}
        onViewCredentials={jest.fn()}
        bulkOperations={{ generating: false, resetting: false, notifying: false, exporting: false }}
      />
    )
    
    // Select students and trigger bulk generation
    const generateButton = screen.getByRole('button', { name: /generate credentials/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(mockOnBulkGenerate).toHaveBeenCalledWith(['1', '2'])
    })
  })
})
```

### 3. Accessibility Testing
```typescript
// /src/components/__tests__/credentials-table.a11y.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CredentialsTable } from '../credentials-table'

expect.extend(toHaveNoViolations)

describe('CredentialsTable Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const mockStudents = [
      {
        id: '1',
        full_name: 'John Doe',
        student_id: 'STU001',
        credentials: { hasCredentials: true, username: 'john24abc' }
      }
    ]
    
    const { container } = render(
      <CredentialsTable
        students={mockStudents}
        selectedStudents={[]}
        onSelectionChange={jest.fn()}
        onGenerateCredentials={jest.fn()}
        onResetPassword={jest.fn()}
        onViewCredentials={jest.fn()}
        bulkOperations={{ generating: false, resetting: false, notifying: false, exporting: false }}
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  it('should have proper ARIA labels for screen readers', () => {
    render(
      <CredentialsTable
        students={[]}
        selectedStudents={[]}
        onSelectionChange={jest.fn()}
        onGenerateCredentials={jest.fn()}
        onResetPassword={jest.fn()}
        onViewCredentials={jest.fn()}
        bulkOperations={{ generating: false, resetting: false, notifying: false, exporting: false }}
      />
    )
    
    expect(screen.getByRole('grid', { name: /student credentials table/i })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(4)
  })
})
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Status**: Ready for implementation
- [ ] Create base component structure for credential management
- [ ] Set up Zustand store for credential state management  
- [ ] Implement core shadcn/ui component integration
- [ ] Create responsive layout components
- [ ] Add basic routing structure for credential pages

### Phase 2: Core Functionality (Week 2)
**Status**: Dependent on Phase 1
- [ ] Implement CredentialGeneration form component
- [ ] Create CredentialsTable with bulk operations
- [ ] Add secure credential display components
- [ ] Implement parent notification UI
- [ ] Create mobile-responsive credential cards

### Phase 3: Advanced Features (Week 3)
**Status**: Dependent on Phase 2
- [ ] Add credential audit log viewer
- [ ] Implement bulk credential operations
- [ ] Create advanced filtering and search
- [ ] Add virtualization for large datasets
- [ ] Implement security access controls

### Phase 4: Polish & Testing (Week 4)
**Status**: Dependent on Phase 3
- [ ] Complete accessibility compliance testing
- [ ] Add comprehensive component tests
- [ ] Implement performance optimizations
- [ ] Create documentation and user guides
- [ ] Final security audit and compliance review

## Conclusion

This frontend architecture provides a comprehensive, secure, and user-friendly solution for managing student credentials within the Harry School CRM system. The design seamlessly integrates with existing admin panel patterns while introducing specialized components for educational data protection and FERPA compliance.

**Key Benefits:**
- **Security-First Design**: All credential-related UI components include built-in security measures and audit logging
- **Educational Compliance**: FERPA-compliant interfaces with proper parent access controls and data protection
- **Performance Optimized**: Virtualization and efficient data loading for 500+ student records
- **Accessibility Ready**: WCAG 2.1 AA compliant with comprehensive keyboard navigation
- **Mobile Responsive**: Optimized for both desktop administrative workflows and tablet usage
- **Scalable Architecture**: Component-based design that can grow with additional credential management features

The implementation follows established patterns from the existing codebase while extending functionality to meet the critical security requirements identified in the security audit. All components are designed to be reusable, testable, and maintainable within the Next.js 14+ App Router architecture.
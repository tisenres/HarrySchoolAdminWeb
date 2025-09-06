'use client'

import React, { Suspense, lazy, memo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { TableSkeleton, CardSkeleton, DashboardSkeleton } from '@/components/ui/skeleton-loaders'

// Error fallback component
const ErrorFallback = memo<{ error: Error; resetErrorBoundary: () => void }>(
  ({ error, resetErrorBoundary }) => (
    <div className="p-8 text-center">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {error.message || 'Failed to load component'}
        </p>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  )
)

ErrorFallback.displayName = 'ErrorFallback'

// Generic dynamic component loader with error boundary and loading state
interface DynamicComponentProps {
  fallback?: React.ComponentType
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  children: React.ReactNode
}

const DynamicComponentWrapper = memo<DynamicComponentProps>(({
  fallback: LoadingFallback,
  errorFallback = ErrorFallback,
  children
}) => (
  <ErrorBoundary FallbackComponent={errorFallback}>
    <Suspense fallback={LoadingFallback ? <LoadingFallback /> : <div>Loading...</div>}>
      {children}
    </Suspense>
  </ErrorBoundary>
))

DynamicComponentWrapper.displayName = 'DynamicComponentWrapper'

// Dynamic imports for admin components

// Students module
export const DynamicStudentsTable = lazy(() => 
  import('@/components/admin/students/students-table').then(module => ({
    default: module.StudentsTable
  }))
)

export const DynamicStudentsVirtualTable = lazy(() =>
  import('@/components/admin/students/students-virtual-table').then(module => ({
    default: module.StudentsVirtualTable
  }))
)

export const DynamicStudentForm = lazy(() =>
  import('@/components/admin/students/student-form').then(module => ({
    default: module.StudentForm
  }))
)

export const DynamicStudentProfile = lazy(() =>
  import('@/components/admin/students/student-profile').then(module => ({
    default: module.StudentProfile
  }))
)

export const DynamicStudentsFilters = lazy(() =>
  import('@/components/admin/students/students-filters').then(module => ({
    default: module.StudentsFilters
  }))
)

// Groups module  
export const DynamicGroupsTable = lazy(() =>
  import('@/components/admin/groups/groups-table').then(module => ({
    default: module.GroupsTable
  }))
)

export const DynamicGroupsVirtualTable = lazy(() =>
  import('@/components/admin/groups/groups-virtual-table').then(module => ({
    default: module.GroupsVirtualTable
  }))
)

export const DynamicGroupForm = lazy(() =>
  import('@/components/admin/groups/group-form').then(module => ({
    default: module.GroupForm
  }))
)

export const DynamicGroupProfile = lazy(() =>
  import('@/components/admin/groups/group-profile').then(module => ({
    default: module.GroupProfile
  }))
)

export const DynamicScheduleEditor = lazy(() =>
  import('@/components/admin/groups/schedule-editor').then(module => ({
    default: module.ScheduleEditor
  }))
)

// Teachers module (already exists)
export const DynamicTeachersTable = lazy(() =>
  import('@/components/admin/teachers/teachers-table').then(module => ({
    default: module.TeachersTable
  }))
)

export const DynamicTeacherForm = lazy(() =>
  import('@/components/admin/teachers/teacher-form').then(module => ({
    default: module.TeacherForm
  }))
)

export const DynamicTeacherProfile = lazy(() =>
  import('@/components/admin/teachers/teacher-profile').then(module => ({
    default: module.TeacherProfile
  }))
)

// Performance dashboard
export const DynamicPerformanceDashboard = lazy(() =>
  import('@/components/admin/performance/performance-dashboard').then(module => ({
    default: module.PerformanceDashboard
  }))
)

// Convenience wrappers with proper loading states

export const StudentsTableWithLoading = memo(() => (
  <DynamicComponentWrapper fallback={() => <TableSkeleton rows={8} columns={7} />}>
    <DynamicStudentsTable 
      students={[]} 
      onEdit={() => {}} 
      onDelete={() => {}} 
      onBulkDelete={() => {}}
      selectedStudents={[]}
      onSelectionChange={() => {}}
    />
  </DynamicComponentWrapper>
))

StudentsTableWithLoading.displayName = 'StudentsTableWithLoading'

export const StudentsVirtualTableWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <TableSkeleton rows={8} columns={7} />}>
    <DynamicStudentsVirtualTable {...props} />
  </DynamicComponentWrapper>
))

StudentsVirtualTableWithLoading.displayName = 'StudentsVirtualTableWithLoading'

export const GroupsTableWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <TableSkeleton rows={6} columns={8} />}>
    <DynamicGroupsTable {...props} />
  </DynamicComponentWrapper>
))

GroupsTableWithLoading.displayName = 'GroupsTableWithLoading'

export const GroupsVirtualTableWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <TableSkeleton rows={6} columns={8} />}>
    <DynamicGroupsVirtualTable {...props} />
  </DynamicComponentWrapper>
))

GroupsVirtualTableWithLoading.displayName = 'GroupsVirtualTableWithLoading'

export const TeachersTableWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <TableSkeleton rows={5} columns={6} />}>
    <DynamicTeachersTable {...props} />
  </DynamicComponentWrapper>
))

TeachersTableWithLoading.displayName = 'TeachersTableWithLoading'

export const StudentFormWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <CardSkeleton lines={8} />}>
    <DynamicStudentForm {...props} />
  </DynamicComponentWrapper>
))

StudentFormWithLoading.displayName = 'StudentFormWithLoading'

export const GroupFormWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <CardSkeleton lines={6} />}>
    <DynamicGroupForm {...props} />
  </DynamicComponentWrapper>
))

GroupFormWithLoading.displayName = 'GroupFormWithLoading'

export const TeacherFormWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <CardSkeleton lines={7} />}>
    <DynamicTeacherForm {...props} />
  </DynamicComponentWrapper>
))

TeacherFormWithLoading.displayName = 'TeacherFormWithLoading'

export const PerformanceDashboardWithLoading = memo<any>((props: any) => (
  <DynamicComponentWrapper fallback={() => <DashboardSkeleton />}>
    <DynamicPerformanceDashboard {...props} />
  </DynamicComponentWrapper>
))

PerformanceDashboardWithLoading.displayName = 'PerformanceDashboardWithLoading'

// Higher-order component for creating dynamic components with loading states
export function withDynamicLoading<T extends Record<string, any>>(
  importPromise: () => Promise<{ default: React.ComponentType<T> }>,
  LoadingComponent?: React.ComponentType,
  ErrorComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) {
  const DynamicComponent = lazy(importPromise)
  
  return memo<T>((props) => (
    <DynamicComponentWrapper 
      {...(LoadingComponent ? { fallback: LoadingComponent } : {})}
      {...(ErrorComponent ? { errorFallback: ErrorComponent } : {})}
    >
      <DynamicComponent {...props} />
    </DynamicComponentWrapper>
  ))
}

// Utility function to preload components
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Start loading the component
  importFn().catch(error => {
    console.warn('Failed to preload component:', error)
  })
}

// Route-based code splitting helpers
export const preloadRouteComponents = () => {
  // Preload components that are likely to be needed soon
  if (typeof window !== 'undefined') {
    // Preload on user interaction or after initial render
    requestIdleCallback(() => {
      preloadComponent(() => import('@/components/admin/students/students-virtual-table'))
      preloadComponent(() => import('@/components/admin/groups/groups-virtual-table'))
      preloadComponent(() => import('@/components/admin/performance/performance-dashboard'))
    })
  }
}

// Component registry for dynamic loading
export const componentRegistry = {
  // Students
  'students/table': DynamicStudentsTable,
  'students/virtual-table': DynamicStudentsVirtualTable,
  'students/form': DynamicStudentForm,
  'students/profile': DynamicStudentProfile,
  'students/filters': DynamicStudentsFilters,

  // Groups
  'groups/table': DynamicGroupsTable,
  'groups/virtual-table': DynamicGroupsVirtualTable,
  'groups/form': DynamicGroupForm,
  'groups/profile': DynamicGroupProfile,
  'groups/schedule-editor': DynamicScheduleEditor,

  // Teachers
  'teachers/table': DynamicTeachersTable,
  'teachers/form': DynamicTeacherForm,
  'teachers/profile': DynamicTeacherProfile,

  // Performance
  'performance/dashboard': DynamicPerformanceDashboard,
} as const

// Dynamic component loader by key
export const getDynamicComponent = (key: keyof typeof componentRegistry) => {
  return componentRegistry[key]
}

// Performance optimization: Create a component that only loads when visible
export const LazyComponent = memo<{
  component: keyof typeof componentRegistry
  fallback?: React.ComponentType
  rootMargin?: string
  threshold?: number
  [key: string]: any
}>(({ 
  component, 
  fallback, 
  rootMargin = '100px', 
  threshold = 0.1, 
  ...props 
}) => {
  const [shouldLoad, setShouldLoad] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  const DynamicComponent = getDynamicComponent(component)

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <DynamicComponentWrapper {...(fallback ? { fallback } : {})}>
          <DynamicComponent {...(props as any)} />
        </DynamicComponentWrapper>
      ) : (
        fallback ? React.createElement(fallback) : <div className="h-64 bg-muted animate-pulse rounded" />
      )}
    </div>
  )
})

LazyComponent.displayName = 'LazyComponent'
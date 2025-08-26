import { lazy, ComponentType, LazyExoticComponent } from 'react'

/**
 * PERFORMANCE OPTIMIZATION: Enhanced lazy loading with preloading capabilities
 * Improves perceived performance by preloading components before they're needed
 */

export interface LazyComponentOptions {
  /**
   * Preload the component after this delay (ms)
   * Use for components likely to be used soon
   */
  preloadDelay?: number
  
  /**
   * Enable hover preloading
   * Preloads when user hovers over trigger elements
   */
  enableHoverPreload?: boolean
  
  /**
   * Component name for debugging
   */
  name?: string
}

/**
 * Enhanced lazy loading with preloading support
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> } {
  
  const { preloadDelay, name = 'Component' } = options
  
  let preloadPromise: Promise<{ default: T }> | null = null
  
  const preload = () => {
    if (!preloadPromise) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Preloading ${name}`)
      }
      preloadPromise = importFn()
    }
    return preloadPromise
  }
  
  // Auto-preload after delay
  if (preloadDelay && typeof window !== 'undefined') {
    setTimeout(() => {
      preload()
    }, preloadDelay)
  }
  
  const LazyComponent = lazy(() => {
    if (preloadPromise) {
      return preloadPromise
    }
    return importFn()
  }) as LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> }
  
  LazyComponent.preload = preload
  
  return LazyComponent
}

/**
 * Preload multiple components in parallel
 */
export function preloadComponents(components: Array<{ preload: () => Promise<any> }>) {
  return Promise.all(components.map(comp => comp.preload().catch(() => {})))
}

/**
 * Route-based preloading utility
 */
export class RoutePreloader {
  private static preloadedRoutes = new Set<string>()
  
  static preloadRoute(routeName: string, components: Array<{ preload: () => Promise<any> }>) {
    if (this.preloadedRoutes.has(routeName)) {
      return
    }
    
    this.preloadedRoutes.add(routeName)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Preloading route: ${routeName}`)
    }
    
    preloadComponents(components)
  }
}

// OPTIMIZED LAZY COMPONENTS FOR ADMIN PANEL

// Critical components - preload quickly
export const StudentsTable = createLazyComponent(
  () => import('@/components/admin/students/students-virtual-table').then(mod => ({ default: mod.StudentsVirtualTable })),
  { name: 'StudentsTable', preloadDelay: 1000 }
)

export const GroupsTable = createLazyComponent(
  () => import('@/components/admin/groups/groups-virtual-table').then(mod => ({ default: mod.GroupsVirtualTable })),
  { name: 'GroupsTable', preloadDelay: 1500 }
)

export const TeachersTable = createLazyComponent(
  () => import('@/components/admin/teachers/teachers-table').then(mod => ({ default: mod.TeachersTable })),
  { name: 'TeachersTable', preloadDelay: 2000 }
)

// Form components - load on demand
export const StudentForm = createLazyComponent(
  () => import('@/components/admin/students/student-form').then(mod => ({ default: mod.StudentForm })),
  { name: 'StudentForm' }
)

export const GroupForm = createLazyComponent(
  () => import('@/components/admin/groups/group-form').then(mod => ({ default: mod.GroupForm })),
  { name: 'GroupForm' }
)

export const TeacherForm = createLazyComponent(
  () => import('@/components/admin/teachers/teacher-form').then(mod => ({ default: mod.TeacherForm })),
  { name: 'TeacherForm' }
)

// Filter components - preload moderately
export const StudentsFilters = createLazyComponent(
  () => import('@/components/admin/students/students-filters').then(mod => ({ default: mod.StudentsFilters })),
  { name: 'StudentsFilters', preloadDelay: 3000 }
)

export const GroupsFilters = createLazyComponent(
  () => import('@/components/admin/groups/groups-filters').then(mod => ({ default: mod.GroupsFilters })),
  { name: 'GroupsFilters', preloadDelay: 3500 }
)

export const TeachersFilters = createLazyComponent(
  () => import('@/components/admin/teachers/teachers-filters').then(mod => ({ default: mod.TeachersFilters })),
  { name: 'TeachersFilters', preloadDelay: 4000 }
)

// Dashboard components - preload based on usage patterns
export const DashboardStats = createLazyComponent(
  () => import('@/components/admin/dashboard/stats-card-optimized').then(mod => ({ default: mod.StatsCard })),
  { name: 'DashboardStats', preloadDelay: 500 }
)

export const RevenueChart = createLazyComponent(
  () => import('@/components/admin/dashboard/revenue-chart').then(mod => ({ default: mod.RevenueChart })),
  { name: 'RevenueChart', preloadDelay: 2500 }
)

export const EnrollmentChart = createLazyComponent(
  () => import('@/components/admin/dashboard/enrollment-chart').then(mod => ({ default: mod.EnrollmentChart })),
  { name: 'EnrollmentChart', preloadDelay: 3000 }
)

// Settings components - load on demand (rarely used)
export const SystemSettings = createLazyComponent(
  () => import('@/components/admin/settings/system-settings'),
  { name: 'SystemSettings' }
)

export const OrganizationSettings = createLazyComponent(
  () => import('@/components/admin/settings/organization-settings'),
  { name: 'OrganizationSettings' }
)

export const SecuritySettings = createLazyComponent(
  () => import('@/components/admin/settings/security-settings'),
  { name: 'SecuritySettings' }
)

// Preload strategies by route
export const ROUTE_PRELOAD_MAP = {
  '/students': [StudentsTable, StudentsFilters, StudentForm],
  '/groups': [GroupsTable, GroupsFilters, GroupForm],
  '/teachers': [TeachersTable, TeachersFilters, TeacherForm],
  '/dashboard': [DashboardStats, RevenueChart, EnrollmentChart],
}

/**
 * Initialize route-based preloading
 * Call this in your layout or routing component
 */
export function initializeRoutePreloading(currentRoute: string) {
  const components = ROUTE_PRELOAD_MAP[currentRoute as keyof typeof ROUTE_PRELOAD_MAP]
  if (components) {
    RoutePreloader.preloadRoute(currentRoute, components)
  }
}
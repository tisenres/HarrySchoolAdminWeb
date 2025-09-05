/**
 * Optimized Icon System for Harry School CRM
 * Reduces bundle size by creating a centralized icon registry
 */

import React, { lazy, ComponentType } from 'react'
import { LucideIcon } from 'lucide-react'

// Core icons that are used frequently (loaded immediately)
export {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Menu,
  Settings,
  User,
  Users,
  Home,
  Calendar,
  BookOpen,
  GraduationCap
} from 'lucide-react'

// Lazy-loaded icons (loaded when needed)
const LazyIcons = {
  // Dashboard icons
  BarChart: lazy(() => import('lucide-react').then(mod => ({ default: mod.BarChart }))),
  PieChart: lazy(() => import('lucide-react').then(mod => ({ default: mod.PieChart }))),
  LineChart: lazy(() => import('lucide-react').then(mod => ({ default: mod.LineChart }))),
  TrendingUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp }))),
  TrendingDown: lazy(() => import('lucide-react').then(mod => ({ default: mod.TrendingDown }))),
  Activity: lazy(() => import('lucide-react').then(mod => ({ default: mod.Activity }))),
  
  // CRUD operations
  Edit: lazy(() => import('lucide-react').then(mod => ({ default: mod.Edit }))),
  Trash2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Trash2 }))),
  Archive: lazy(() => import('lucide-react').then(mod => ({ default: mod.Archive }))),
  Copy: lazy(() => import('lucide-react').then(mod => ({ default: mod.Copy }))),
  Save: lazy(() => import('lucide-react').then(mod => ({ default: mod.Save }))),
  
  // File operations
  Download: lazy(() => import('lucide-react').then(mod => ({ default: mod.Download }))),
  Upload: lazy(() => import('lucide-react').then(mod => ({ default: mod.Upload }))),
  FileText: lazy(() => import('lucide-react').then(mod => ({ default: mod.FileText }))),
  FolderOpen: lazy(() => import('lucide-react').then(mod => ({ default: mod.FolderOpen }))),
  
  // Communication
  Mail: lazy(() => import('lucide-react').then(mod => ({ default: mod.Mail }))),
  Phone: lazy(() => import('lucide-react').then(mod => ({ default: mod.Phone }))),
  MessageSquare: lazy(() => import('lucide-react').then(mod => ({ default: mod.MessageSquare }))),
  Bell: lazy(() => import('lucide-react').then(mod => ({ default: mod.Bell }))),
  
  // Media
  Image: lazy(() => import('lucide-react').then(mod => ({ default: mod.Image }))),
  Video: lazy(() => import('lucide-react').then(mod => ({ default: mod.Video }))),
  Camera: lazy(() => import('lucide-react').then(mod => ({ default: mod.Camera }))),
  
  // Financial
  CreditCard: lazy(() => import('lucide-react').then(mod => ({ default: mod.CreditCard }))),
  DollarSign: lazy(() => import('lucide-react').then(mod => ({ default: mod.DollarSign }))),
  Banknote: lazy(() => import('lucide-react').then(mod => ({ default: mod.Banknote }))),
  Receipt: lazy(() => import('lucide-react').then(mod => ({ default: mod.Receipt }))),
  
  // Status indicators
  CheckCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle }))),
  XCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.XCircle }))),
  Clock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock }))),
  AlertTriangle: lazy(() => import('lucide-react').then(mod => ({ default: mod.AlertTriangle }))),
  
  // Navigation
  ArrowLeft: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft }))),
  ArrowRight: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowRight }))),
  ArrowUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowUp }))),
  ArrowDown: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowDown }))),
  ExternalLink: lazy(() => import('lucide-react').then(mod => ({ default: mod.ExternalLink }))),
  
  // Tools
  Refresh: lazy(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw }))),
  Eye: lazy(() => import('lucide-react').then(mod => ({ default: mod.Eye }))),
  EyeOff: lazy(() => import('lucide-react').then(mod => ({ default: mod.EyeOff }))),
  Lock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Lock }))),
  Unlock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Unlock }))),
  
  // Academic
  Award: lazy(() => import('lucide-react').then(mod => ({ default: mod.Award }))),
  Star: lazy(() => import('lucide-react').then(mod => ({ default: mod.Star }))),
  Trophy: lazy(() => import('lucide-react').then(mod => ({ default: mod.Trophy }))),
  Target: lazy(() => import('lucide-react').then(mod => ({ default: mod.Target }))),
  
  // Organization
  Building: lazy(() => import('lucide-react').then(mod => ({ default: mod.Building }))),
  MapPin: lazy(() => import('lucide-react').then(mod => ({ default: mod.MapPin }))),
  Globe: lazy(() => import('lucide-react').then(mod => ({ default: mod.Globe }))),
  
  // Miscellaneous
  MoreVertical: lazy(() => import('lucide-react').then(mod => ({ default: mod.MoreVertical }))),
  MoreHorizontal: lazy(() => import('lucide-react').then(mod => ({ default: mod.MoreHorizontal }))),
  Heart: lazy(() => import('lucide-react').then(mod => ({ default: mod.Heart }))),
  Share: lazy(() => import('lucide-react').then(mod => ({ default: mod.Share }))),
  Flag: lazy(() => import('lucide-react').then(mod => ({ default: mod.Flag }))),
} as const

// Icon registry type
export type IconName = keyof typeof LazyIcons

// Dynamic icon component
interface DynamicIconProps {
  name: IconName
  className?: string
  size?: number
  fallback?: ComponentType<any>
}

export function DynamicIcon({ 
  name, 
  className, 
  size, 
  fallback: Fallback 
}: DynamicIconProps) {
  const IconComponent = LazyIcons[name]
  
  if (!IconComponent) {
    if (Fallback) {
      return <Fallback className={className} size={size} />
    }
    return null
  }
  
  return <IconComponent className={className} size={size} />
}

// Preload frequently used icons
export function preloadIcons(iconNames: IconName[]) {
  if (typeof window !== 'undefined') {
    iconNames.forEach(name => {
      if (LazyIcons[name]) {
        // Start loading the icon
        import('lucide-react').catch(err => {
          console.warn(`Failed to preload icon ${name}:`, err)
        })
      }
    })
  }
}

// Common icon sets for preloading
export const COMMON_ICONS: IconName[] = [
  'Edit',
  'Trash2',
  'Download',
  'Upload',
  'Eye',
  'CheckCircle',
  'XCircle',
  'BarChart'
]

export const DASHBOARD_ICONS: IconName[] = [
  'BarChart',
  'PieChart',
  'LineChart',
  'TrendingUp',
  'Activity',
  'DollarSign'
]

export const CRUD_ICONS: IconName[] = [
  'Edit',
  'Trash2',
  'Copy',
  'Save',
  'Archive'
]

// Initialize icon preloading
if (typeof window !== 'undefined') {
  // Preload common icons after initial page load
  requestIdleCallback(() => {
    preloadIcons(COMMON_ICONS)
  })
  
  // Preload dashboard icons when user likely to navigate there
  setTimeout(() => {
    preloadIcons(DASHBOARD_ICONS)
  }, 2000)
}

export default LazyIcons
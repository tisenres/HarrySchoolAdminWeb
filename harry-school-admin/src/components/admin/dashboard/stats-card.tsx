'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Trend {
  value: number
  isPositive: boolean
}

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: 'Users' | 'UserCheck' | 'GraduationCap' | 'DollarSign'
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange'
  trend?: Trend
  className?: string
}

const iconComponents = {
  Users,
  UserCheck,
  GraduationCap,
  DollarSign,
}

const colorVariants = {
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-200',
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
  },
  red: {
    icon: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-200',
  },
  orange: {
    icon: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200',
  },
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  className,
}: StatsCardProps) {
  const IconComponent = iconComponents[icon]
  const colors = colorVariants[color]

  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn(
            'p-2 rounded-lg',
            colors.bg,
            colors.border,
            'border'
          )}>
            <IconComponent className={cn('h-5 w-5', colors.icon)} />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center space-x-2">
            <div className={cn(
              'flex items-center space-x-1',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs font-medium">
                {trend.value.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StatsCard
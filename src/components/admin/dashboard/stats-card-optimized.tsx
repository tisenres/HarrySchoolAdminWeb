'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  loading?: boolean
  className?: string
}

export function StatsCard({ title, value, change, icon: Icon, loading, className }: StatsCardProps) {
  const isPositive = change ? change > 0 : false
  const isNegative = change ? change < 0 : false
  
  return (
    <Card className={cn('p-4', className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              loading && "animate-pulse bg-muted rounded h-8 w-20"
            )}>
              {loading ? '' : value}
            </p>
            {change !== undefined && !loading && (
              <p className={cn(
                "text-xs mt-1 flex items-center",
                isPositive && "text-green-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-muted-foreground"
              )}>
                {isPositive && "↗"}
                {isNegative && "↘"}
                {Math.abs(change)}% from last month
              </p>
            )}
          </div>
          <div className="ml-4">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
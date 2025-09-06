'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface RevenueData {
  date: string
  amount: number
  type: 'payment' | 'invoice'
  outstanding?: number
}

interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
}

export function RevenueChart({ 
  data, 
  title = "Revenue Overview", 
  description = "Monthly revenue and outstanding payments"
}: RevenueChartProps) {
  // Group data by date and calculate totals
  const processedData = data.reduce((acc, item) => {
    const date = item.date
    const existing = acc.find(d => d.date === date)
    
    if (existing) {
      if (item.type === 'payment') {
        existing.revenue += item.amount
      } else {
        existing.invoiced += item.amount
      }
    } else {
      acc.push({
        date,
        formattedDate: format(parseISO(date), 'MMM yyyy'),
        revenue: item.type === 'payment' ? item.amount : 0,
        invoiced: item.type === 'invoice' ? item.amount : 0,
        outstanding: item.outstanding || 0,
      })
    }
    
    return acc
  }, [] as Array<{
    date: string
    formattedDate: string
    revenue: number
    invoiced: number
    outstanding: number
  }>)

  const totalRevenue = processedData.reduce((sum, item) => sum + item.revenue, 0)
  const totalOutstanding = processedData.reduce((sum, item) => sum + item.outstanding, 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              <span 
                className="inline-block w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              ></span>
              {entry.name}: ${entry.value?.toLocaleString() || 0}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              ${totalOutstanding.toLocaleString()} outstanding
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {processedData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="formattedDate" 
                  className="text-xs" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="rgb(34 197 94)" 
                  name="Revenue"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="invoiced" 
                  fill="rgb(59 130 246)" 
                  name="Invoiced"
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="outstanding" 
                  stroke="rgb(239 68 68)" 
                  strokeWidth={2}
                  name="Outstanding"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 w-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">=°</div>
              <p className="text-sm">No revenue data available</p>
              <p className="text-xs">Revenue data will appear here as payments are processed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RevenueChart
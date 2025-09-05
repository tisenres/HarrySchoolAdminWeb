'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface EnrollmentData {
  date: string
  count: number
  type?: string
}

interface EnrollmentChartProps {
  data: EnrollmentData[]
  title?: string
  description?: string
  chartType?: 'line' | 'bar'
}

export function EnrollmentChart({ 
  data, 
  title = "Enrollment Trends", 
  description = "Student enrollments over time",
  chartType = 'line'
}: EnrollmentChartProps) {
  // Format data for charts
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd'),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Enrollments: {payload[0].value}
          </p>
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
          <div className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, item) => sum + item.count, 0)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="formattedDate" 
                    className="text-xs" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="rgb(59 130 246)" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="formattedDate" 
                    className="text-xs" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="rgb(59 130 246)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 w-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">=Ê</div>
              <p className="text-sm">No enrollment data available</p>
              <p className="text-xs">Data will appear here as students enroll</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EnrollmentChart
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroupedStatsData, type GroupedStatMeasure, formatters } from "@/lib/query/stats"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface GroupedStatCardProps {
  measure: GroupedStatMeasure
  groupBy: string
  relativeDt: string
  asOfDate?: string | null
  className?: string
  filters?: any[]
}

interface GroupedStatData {
  groupValue: string
  current: number
  previous: number
  change: number
  changePercent: number
  counterpartyCount: number
  notionalAmount: number
  percentage: number
}

const CHART_COLORS = [
  '#f9fafb', // gray-50
  '#f3f4f6', // gray-100
  '#e5e7eb', // gray-200  
  '#d1d5db', // gray-300
  '#9ca3af', // gray-400
  '#6b7280', // gray-500
]

function GroupedStatCard({ measure, groupBy, relativeDt, asOfDate, className, filters }: GroupedStatCardProps) {
  const { data, isLoading, error } = useGroupedStatsData(measure, groupBy, relativeDt, asOfDate, filters)

  // Format numbers with proper rounding and millions display for money
  const formatNumber = (value: number) => {
    const roundedValue = Math.round(value * 100) / 100
    
    if (measure.formatter === formatters.currency) {
      const millions = roundedValue / 1000000
      return `$${millions.toFixed(2)}M`
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(roundedValue)
  }

  const formatPercentage = (value: number) => {
    return `(${value.toFixed(1)}%)`
  }

  const chartData = data?.map((item, index) => ({
    name: item.groupValue,
    value: item.current,
    color: CHART_COLORS[index % CHART_COLORS.length]
  })) || []

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">By {groupBy}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2">
            <AlertCircle className="size-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">Error loading data</span>
          </div>
        ) : data && data.length > 0 ? (
          <>
            {/* Donut Chart */}
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Chart Labels */}
              {data.map((item, index) => (
                <div
                  key={item.groupValue}
                  className="absolute text-xs text-muted-foreground"
                  style={{
                    // Position labels around the chart - simplified positioning
                    top: `${25 + (index * 18)}%`,
                    left: index % 2 === 0 ? '5%' : '70%',
                  }}
                >
                  {item.groupValue}: {formatPercentage(item.percentage)}
                </div>
              ))}
            </div>

            {/* Data List */}
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={item.groupValue} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <div>
                      <div className="font-medium text-sm">{item.groupValue}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.counterpartyCount} counterparty
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {formatNumber(item.current)} {formatPercentage(item.percentage)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(item.notionalAmount)} notional
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}

export { GroupedStatCard }
export type { GroupedStatCardProps, GroupedStatData }
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
 
  '#374151', // gray-700
  '#4b5563', // gray-600
  '#6b7280', // gray-500
  '#9ca3af', // gray-400
  '#d1d5db', // gray-300
  '#e5e7eb', // gray-200
  '#f3f4f6', // gray-100
]

function GroupedStatCard({ measure, groupBy, relativeDt, asOfDate, className, filters }: GroupedStatCardProps) {
  const { data, isLoading, error } = useGroupedStatsData(measure, groupBy, relativeDt, asOfDate, filters)

  // Format numbers with proper truncation for display
  const formatNumber = (value: number) => {
    const roundedValue = Math.round(value * 100) / 100
    
    if (measure.formatter === formatters.currency) {
      if (Math.abs(roundedValue) >= 1000000) {
        const millions = roundedValue / 1000000
        return `$${millions.toFixed(1)}M`
      } else if (Math.abs(roundedValue) >= 1000) {
        const thousands = roundedValue / 1000
        return `$${thousands.toFixed(1)}K`
      } else {
        return `$${roundedValue.toFixed(0)}`
      }
    }
    
    // For non-currency numbers (like counterparty counts)
    if (Math.abs(roundedValue) >= 1000000) {
      const millions = roundedValue / 1000000
      return `${millions.toFixed(1)}M`
    } else if (Math.abs(roundedValue) >= 1000) {
      const thousands = roundedValue / 1000
      return `${thousands.toFixed(1)}K`
    }
    
    return Math.round(roundedValue).toString()
  }

  // Format counterparty count specifically
  const formatCounterpartyCount = (value: number) => {
    if (Math.abs(value) >= 1000) {
      const thousands = value / 1000
      return `${thousands.toFixed(1)}K`
    }
    return Math.round(value).toString()
  }

  const formatPercentage = (value: number) => {
    return `(${value.toFixed(1)}%)`
  }

  // Chart data - show first 5 categories, aggregate rest as "Others"
  const chartData = (() => {
    if (!data || data.length === 0) return []
    
    if (data.length <= 5) {
      // Show all items if 5 or fewer
      return data.map((item, index) => ({
        name: item.groupValue,
        value: Math.abs(item.current), // Use absolute value for chart display
        color: item.groupValue === 'Others' ? '#9ca3af' : CHART_COLORS[index % CHART_COLORS.length]
      }))
    } else {
      // Show first 4 items + aggregate others as 5th item
      const topItems = data.slice(0, 4)
      const otherItems = data.slice(4)
      
      const othersValue = otherItems.reduce((sum, item) => sum + item.current, 0)
      
      const chartItems = topItems.map((item, index) => ({
        name: item.groupValue,
        value: Math.abs(item.current), // Use absolute value for chart display
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      
      // Only add Others if there are items to aggregate
      if (otherItems.length > 0) {
        chartItems.push({
          name: 'Others',
          value: Math.abs(othersValue), // Use absolute value for chart display
          color: '#9ca3af'
        })
      }
      
      return chartItems
    }
  })()

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">By {groupBy}</CardTitle>
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
            <div className="h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={1}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Chart Labels */}
              {chartData.map((item, index) => {
                // Calculate percentage for chart data
                const totalChartValue = chartData.reduce((sum, chartItem) => sum + chartItem.value, 0)
                const chartPercentage = totalChartValue > 0 ? (item.value / totalChartValue) * 100 : 0
                
                // Special positioning for "Others" label
                const isOthers = item.name === 'Others'
                let labelStyle = {}
                
                if (isOthers) {
                  // Position "Others" at bottom right
                  labelStyle = {
                    bottom: '5%',
                    right: '2%',
                  }
                } else {
                  // Regular positioning for other items
                  labelStyle = {
                    top: `${15 + (index * 16)}%`,
                    left: index % 2 === 0 ? '2%' : '65%',
                  }
                }
                
                return (
                  <div
                    key={item.name}
                    className={`absolute text-[10px] font-medium bg-background/80 px-1.5 py-0.5 rounded shadow-sm ${
                      isOthers ? 'text-muted-foreground italic' : 'text-foreground'
                    }`}
                    style={labelStyle}
                  >
                    {item.name}: ({chartPercentage.toFixed(1)}%)
                  </div>
                )
              })}
            </div>

            {/* Data List */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              <div className="space-y-1.5 pr-1">
                {data.map((item, index) => {
                  const isOthers = item.groupValue === 'Others'
                  return (
                    <div 
                      key={item.groupValue} 
                      className={`flex items-center justify-between py-1.5 border-b border-border/50 last:border-b-0 ${
                        isOthers ? 'bg-muted/30 rounded-sm px-1' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isOthers ? 'border border-muted-foreground/50' : ''
                          }`}
                          style={{ 
                            backgroundColor: isOthers ? '#9ca3af' : CHART_COLORS[index % CHART_COLORS.length]
                          }}
                        />
                        <div>
                          <div className={`font-medium text-xs ${
                            isOthers ? 'text-muted-foreground italic' : ''
                          }`}>
                            {item.groupValue}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatCounterpartyCount(item.counterpartyCount)} counterparty
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium text-xs ${
                          isOthers ? 'text-muted-foreground' : ''
                        }`}>
                          {formatNumber(item.current)} {formatPercentage(item.percentage)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatNumber(item.notionalAmount)} notional
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}

export { GroupedStatCard }
export type { GroupedStatCardProps, GroupedStatData }
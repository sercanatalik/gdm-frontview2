"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStatsData, type StatMeasure, type StatConfig, formatters } from "@/lib/query/stats"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, BarChart3, DollarSign, Users, Activity } from "lucide-react"

interface StatCardsProps {
  measures: StatMeasure[]
  relativeDt: string
  asOfDate?: string | null
  className?: string
  filters?: any[]
}

interface StatData {
  current: number
  previous: number
  change: number
  changePercent: number
}

function getTrendDisplay(data: StatData) {
  if (data.change === 0) {
    return {
      icon: <Minus className="size-4 text-muted-foreground" />,
      color: "text-muted-foreground"
    }
  }
  
  const isPositive = data.change > 0
  return {
    icon: isPositive 
      ? <TrendingUp className="size-4 text-green-500" />
      : <TrendingDown className="size-4 text-red-500" />,
    color: isPositive ? "text-green-500" : "text-red-500"
  }
}

function StatCard({ measure, data, isLoading, error, relativeDt }: {
  measure: StatMeasure
  data?: StatData
  isLoading?: boolean
  error?: string
  relativeDt: string
}) {
  // Calculate days for display
  const getDaysText = (relativeDt: string) => {
    switch (relativeDt) {
      case '-1d': return '1'
      case '-1w': return '7'
      case '-1m': return '30'
      case '-6m': return '180'
      case '-1y': return '365'
      default: return 'N/A'
    }
  }

  // Format numbers with proper rounding and millions display for money
  const formatNumber = (value: number) => {
    const roundedValue = Math.round(value * 100) / 100
    
    if (measure.formatter === formatters.currency) {
      const millions = roundedValue / 1000000
      return `$${millions.toFixed(2)}mio`
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(roundedValue)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-sm font-medium">{measure.label}</CardTitle>
        {measure.icon || <BarChart3 className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="pt-0 space-y-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2">
            <AlertCircle className="size-4 text-destructive" />
            <span className="text-sm text-destructive">Error loading data</span>
          </div>
        ) : data ? (
          <>
            <div className="text-2xl font-bold">
              {formatNumber(data.current)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {data.change >= 0 ? "+ " : "- "}
              {formatNumber(Math.abs(data.change))} since {getDaysText(relativeDt)} days ago
            </p>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatCards({ measures, relativeDt, asOfDate, className, filters }: StatCardsProps) {
  const { data, isLoading, error } = useStatsData(measures, relativeDt, asOfDate, filters)

  return (
    <div className={cn("grid gap-2 md:grid-cols-2 lg:grid-cols-6", className)}>
      {measures.map((measure) => (
        <StatCard
          key={measure.key}
          measure={measure}
          data={data?.[measure.key]}
          isLoading={isLoading}
          error={error?.message}
          relativeDt={relativeDt}
        />
      ))}
    </div>
  )
}

// Default measure configurations
export const defaultStatConfigs = [
  {
    key: 'transactions',
    label: 'Transactions',
    field: 'id',
    tableName: 'risk_f_mv',
    aggregation: 'count' as const,
    formatter: formatters.number,
    icon: <Activity className="size-4 text-blue-500" />,
  },
  {
    key: 'bookings',
    label: 'Active Bookings',
    field: 'book',
    tableName: 'risk_f_mv',
    aggregation: 'count' as const,
    formatter: formatters.number,
    icon: <BarChart3 className="size-4 text-purple-500" />,
  },
  {
    key: 'cashOut',
    label: 'Total cashOut&L',
    field: 'cashOut',
    tableName: 'risk_f_mv',
    aggregation: 'sum' as const,
    formatter: formatters.currency,
    icon: <DollarSign className="size-4 text-green-500" />,
  },
  {
    key: 'tradeCount',
    label: 'Trade Count',
    field: 'id',
    tableName: 'risk_f_mv',
    aggregation: 'count' as const,
    formatter: formatters.number,
    icon: <Activity className="size-4 text-blue-500" />,
  },
  {
    key: 'underlyingAmount',
    label: 'Avg Position',
    field: 'underlyingAmount',
    tableName: 'risk_f_mv',
    aggregation: 'avg' as const,
    formatter: formatters.currency,
    icon: <BarChart3 className="size-4 text-purple-500" />,
  },
  {
    key: 'active_desks',
    label: 'Active Desks',
    field: 'desk',
    tableName: 'risk_f_mv',
    aggregation: 'count' as const,
    formatter: formatters.number,
    icon: <Users className="size-4 text-orange-500" />,
  },
]

export type { StatMeasure, StatConfig }
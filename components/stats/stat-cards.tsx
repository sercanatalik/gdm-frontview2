"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStatsData, type StatMeasure, type StatConfig, formatters } from "@/lib/query/stats"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, BarChart3, DollarSign, Users, Activity } from "lucide-react"

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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
        <CardTitle className="text-xs sm:text-sm font-medium leading-tight truncate pr-1">{measure.label}</CardTitle>
        {measure.icon || <BarChart3 className="size-3 sm:size-4 text-muted-foreground flex-shrink-0" />}
      </CardHeader>
      <CardContent className="pt-0 space-y-0 px-3 pb-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-8 sm:h-10">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-1 sm:space-x-2">
            <AlertCircle className="size-3 sm:size-4 text-destructive flex-shrink-0" />
            <span className="text-xs sm:text-sm text-destructive">Error loading data</span>
          </div>
        ) : data ? (
          <>
            <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-bold leading-tight break-all">
              {formatNumber(data.current)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
              {data.change >= 0 ? "+ " : "- "}
              {formatNumber(Math.abs(data.change))} since {getDaysText(relativeDt)} days ago
            </p>
          </>
        ) : (
          <div className="text-xs sm:text-sm text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatCards({ measures, relativeDt, asOfDate, className, filters }: StatCardsProps) {
  const { data, isLoading, error } = useStatsData(measures, relativeDt, asOfDate, filters)

  return (
    <div className={cn("grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", className)}>
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
    field: 'tradeId',
    tableName: 'f_exposure',
    aggregation: 'count' as const,
    formatter: formatters.number,
    icon: <Activity className="size-4 text-blue-500" />,
  },
  {
    key: 'bookings',
    label: 'Active Bookings',
    field: 'book',
    tableName: 'f_exposure',
    aggregation: 'countDistinct' as const,
    formatter: formatters.number,
    icon: <BarChart3 className="size-4 text-purple-500" />,
  },
  {
    key: 'fundingAmount',
    label: 'Total fundingAmount&L',
    field: 'fundingAmount',
    tableName: 'f_exposure',
    aggregation: 'sum' as const,
    formatter: formatters.currency,
    icon: <DollarSign className="size-4 text-green-500" />,
  },
  {
    key: 'tradeCount',
    label: 'Trade Count',
    field: 'tradeId',
    tableName: 'f_exposure',
    aggregation: 'count' as const,
    formatter: formatters.number,
    icon: <Activity className="size-4 text-blue-500" />,
  },
  {
    key: 'underlyingAmount',
    label: 'Avg Position',
    field: 'i_outstandingAmt',
    tableName: 'f_exposure',
    aggregation: 'avg' as const,
    formatter: formatters.currency,
    icon: <BarChart3 className="size-4 text-purple-500" />,
  },
  {
    key: 'active_desks',
    label: 'Active Desks',
    field: 'hmsDesk',
    tableName: 'f_exposure',
    aggregation: 'count' as const,
    formatter: formatters.number,
    icon: <Users className="size-4 text-orange-500" />,
  },
]

export type { StatMeasure, StatConfig }